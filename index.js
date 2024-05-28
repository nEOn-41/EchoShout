const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, AudioPlayerStatus, entersState } = require('@discordjs/voice');
const { FFmpeg } = require('prism-media');
const fs = require('fs');
const { getServerData, saveServerData } = require('./database');
const logger = require('./logger');
require('dotenv').config();

// Set the FFmpeg path
FFmpeg.getInfo = () => ({
    command: 'C:\\Users\\navee\\Downloads\\ffmpeg-7.0-essentials_build\\ffmpeg-7.0-essentials_build\\bin\\ffmpeg.exe',
    input: ['-i', 'pipe:0'],
    output: ['-f', 'opus', 'pipe:1']
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const serverData = {}; // Store data for each server in memory
const audioLength = 18; // Length of the audio in seconds
const extraTime = 10; // Extra time for delays and leaving VC

const getRandomInterval = (frequency) => {
    return Math.floor(Math.random() * (frequency - audioLength - extraTime)) * 1000;
};

const startInterval = (guildId) => {
    if (serverData[guildId].currentTimeout) {
        clearTimeout(serverData[guildId].currentTimeout);
    }

    serverData[guildId].currentTimeout = setTimeout(() => {
        if (serverData[guildId].isPaused) return startInterval(guildId);

        if (serverData[guildId].botChannels.length > 0) {
            const randomDelay = getRandomInterval(serverData[guildId].frequency);
            setTimeout(() => {
                const channelName = serverData[guildId].botChannels[Math.floor(Math.random() * serverData[guildId].botChannels.length)];
                const channel = client.channels.cache.find(ch => ch.name === channelName && ch.guild.id === guildId && ch.type === 2); // 2 is the type for GUILD_VOICE

                if (channel) {
                    const connection = joinVoiceChannel({
                        channelId: channel.id,
                        guildId: channel.guild.id,
                        adapterCreator: channel.guild.voiceAdapterCreator,
                    });

                    let isDestroyed = false;

                    const leaveTimeout = setTimeout(() => {
                        if (!isDestroyed) {
                            connection.destroy();
                            isDestroyed = true;
                            logger.info(`Left ${channel.name} after timeout`);
                        }
                    }, (audioLength + extraTime) * 1000); // Adjusting the timeout

                    connection.on(VoiceConnectionStatus.Ready, () => {
                        logger.info(`Connected to ${channel.name}`);
                        const player = createAudioPlayer();
                        const resource = createAudioResource(serverData[guildId].screamFile);

                        player.play(resource);
                        connection.subscribe(player);

                        player.on(AudioPlayerStatus.Idle, () => {
                            if (!isDestroyed) {
                                clearTimeout(leaveTimeout);
                                connection.destroy();
                                isDestroyed = true;
                                logger.info(`Finished playing audio in ${channel.name}`);
                            }
                        });

                        // Award points to members in the channel
                        channel.members.forEach(member => {
                            if (member.user.bot) return;
                            if (!serverData[guildId].leaderboard[member.user.id]) serverData[guildId].leaderboard[member.user.id] = 0;
                            serverData[guildId].leaderboard[member.user.id]++;
                        });
                        saveServerData(guildId, serverData[guildId]); // Save data to the database
                    });

                    connection.on('error', (error) => {
                        logger.error(`Connection error in ${channel.name}: ${error.message}`);
                        if (!isDestroyed) {
                            clearTimeout(leaveTimeout);
                            connection.destroy();
                            isDestroyed = true;
                        }
                    });

                    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                        try {
                            await Promise.race([
                                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                            ]);
                            // Seems to be reconnecting to a new channel - ignore disconnect
                        } catch (error) {
                            // Seems to be a real disconnect which wasn't recovered from in time - destroy connection
                            logger.error(`Disconnected from ${channel.name}: ${error.message}`);
                            if (!isDestroyed) {
                                clearTimeout(leaveTimeout);
                                connection.destroy();
                                isDestroyed = true;
                            }
                        }
                    });
                }
            }, randomDelay);
        }
        startInterval(guildId); // Restart the interval
    }, serverData[guildId].frequency * 1000);
};

client.once('ready', () => {
    logger.info(`Logged in as ${client.user.tag}!`);
    client.guilds.cache.forEach(guild => {
        getServerData(guild.id, (data) => {
            if (!data) {
                serverData[guild.id] = {
                    botChannels: [],
                    commandChannel: null,
                    leaderboard: {},
                    frequency: 3600, // Default to 1 hour
                    currentTimeout: null,
                    isPaused: false,
                    screamFile: 'C:\\Users\\navee\\Desktop\\My Projects\\EchoShout\\scream.mp3' // Correct path to your scream audio file
                };
            } else {
                serverData[guild.id] = {
                    botChannels: JSON.parse(data.bot_channels),
                    commandChannel: data.command_channel,
                    leaderboard: JSON.parse(data.leaderboard),
                    frequency: data.frequency,
                    currentTimeout: null,
                    isPaused: data.is_paused === 1,
                    screamFile: 'C:\\Users\\navee\\Desktop\\My Projects\\EchoShout\\scream.mp3' // Correct path to your scream audio file
                };
            }
            startInterval(guild.id);
        });
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options, guildId } = interaction;

    if (!serverData[guildId]) {
        serverData[guildId] = {
            botChannels: [],
            commandChannel: null,
            leaderboard: {},
            frequency: 3600, // Default to 1 hour
            currentTimeout: null,
            isPaused: false,
            screamFile: 'C:\\Users\\navee\\Desktop\\My Projects\\EchoShout\\scream.mp3' // Correct path to your scream audio file
        };
        startInterval(guildId);
    }

    if (commandName === 'add_bot_channel' && interaction.member.permissions.has('ADMINISTRATOR')) {
        const channel = options.getChannel('channel');
        if (!serverData[guildId].botChannels.includes(channel.name)) {
            serverData[guildId].botChannels.push(channel.name);
            saveServerData(guildId, serverData[guildId]); // Save data to the database
            await interaction.reply(`Added ${channel.name} to the bot's channel list.`);
            logger.info(`Added ${channel.name} to bot channels in guild ${guildId}`);
        } else {
            await interaction.reply(`${channel.name} is already in the bot's channel list.`);
            logger.info(`${channel.name} is already in the bot's channel list in guild ${guildId}`);
        }
    } else if (commandName === 'remove_bot_channel' && interaction.member.permissions.has('ADMINISTRATOR')) {
        const channel = options.getChannel('channel');
        serverData[guildId].botChannels = serverData[guildId].botChannels.filter(name => name !== channel.name);
        saveServerData(guildId, serverData[guildId]); // Save data to the database
        await interaction.reply(`Removed ${channel.name} from the bot's channel list.`);
        logger.info(`Removed ${channel.name} from bot channels in guild ${guildId}`);
    } else if (commandName === 'set_command_channel' && interaction.member.permissions.has('ADMINISTRATOR')) {
        const channel = options.getChannel('channel');
        serverData[guildId].commandChannel = channel.id;
        saveServerData(guildId, serverData[guildId]); // Save data to the database
        await interaction.reply(`This channel (${channel.name}) is now set for bot commands.`);
        logger.info(`Set ${channel.name} as command channel in guild ${guildId}`);
    } else if (commandName === 'set_frequency' && interaction.member.permissions.has('ADMINISTRATOR')) {
        const seconds = options.getInteger('seconds');
        if (seconds < (audioLength + extraTime)) {
            await interaction.reply(`Error: Frequency must be greater than ${audioLength + extraTime} seconds.`);
            logger.warn(`Attempt to set frequency below minimum in guild ${guildId}`);
            return;
        }
        serverData[guildId].frequency = seconds;
        startInterval(guildId); // Restart the interval with the new frequency
        saveServerData(guildId, serverData[guildId]); // Save data to the database
        await interaction.reply(`Frequency set to ${seconds} seconds.`);
        logger.info(`Frequency set to ${seconds} seconds in guild ${guildId}`);
    } else if (commandName === 'pause' && interaction.member.permissions.has('ADMINISTRATOR')) {
        serverData[guildId].isPaused = true;
        saveServerData(guildId, serverData[guildId]); // Save data to the database
        await interaction.reply('Bot is paused.');
        logger.info(`Bot paused in guild ${guildId}`);
    } else if (commandName === 'resume' && interaction.member.permissions.has('ADMINISTRATOR')) {
        serverData[guildId].isPaused = false;
        startInterval(guildId);
        saveServerData(guildId, serverData[guildId]); // Save data to the database
        await interaction.reply('Bot is resumed.');
        logger.info(`Bot resumed in guild ${guildId}`);
    } else if (commandName === 'reset_stats' && interaction.member.permissions.has('ADMINISTRATOR')) {
        serverData[guildId].leaderboard = {};
        saveServerData(guildId, serverData[guildId]); // Save data to the database
        await interaction.reply('Leaderboard and stats have been reset.');
        logger.info(`Leaderboard and stats reset in guild ${guildId}`);
    } else if (commandName === 'leaderboard' && interaction.member.permissions.has('ADMINISTRATOR')) {
        const csvContent = [
            ['User ID', 'Username', 'Points'],
            ...await Promise.all(Object.entries(serverData[guildId].leaderboard).map(async ([id, points]) => {
                const user = await client.users.fetch(id);
                return [parseInt(id), user.username, points]; // Cast ID to integer
            }))
        ]
        .map(e => e.join(','))
        .join('\n');
        
        const filePath = 'leaderboard.csv';
        fs.writeFileSync(filePath, csvContent);

        const attachment = new AttachmentBuilder(filePath);
        await interaction.reply({ files: [attachment] });
        logger.info(`Generated leaderboard CSV in guild ${guildId}`);
    } else if (commandName === 'top') {
        if (interaction.channel.id !== serverData[guildId].commandChannel) {
            return await interaction.reply('This command can only be used in the designated command channel.');
        }
        if (Object.keys(serverData[guildId].leaderboard).length === 0) {
            return await interaction.reply('No stats available yet.');
        }
        const sortedLeaderboard = Object.entries(serverData[guildId].leaderboard).sort(([, a], [, b]) => b - a).slice(0, 10);
        const topEmbed = new EmbedBuilder()
            .setColor('#00FFFF') // Using hexadecimal value for AQUA
            .setTitle('Top 10 Leaderboard')
            .setDescription(sortedLeaderboard.map(([id, points], index) => `${index + 1}. <@${id}> - ${points} points`).join('\n'));

        await interaction.reply({ embeds: [topEmbed] });
        logger.info(`Displayed top 10 leaderboard in guild ${guildId}`);
    } else if (commandName === 'stats') {
        if (interaction.channel.id !== serverData[guildId].commandChannel) {
            return await interaction.reply('This command can only be used in the designated command channel.');
        }
        if (Object.keys(serverData[guildId].leaderboard).length === 0) {
            return await interaction.reply('No stats available yet.');
        }
        const userPoints = serverData[guildId].leaderboard[interaction.user.id] || 0;
        const sortedLeaderboard = Object.entries(serverData[guildId].leaderboard).sort(([, a], [, b]) => b - a);
        const rank = sortedLeaderboard.findIndex(([id]) => id === interaction.user.id) + 1;

        const statsEmbed = new EmbedBuilder()
            .setColor('#00FFFF') // Using hexadecimal value for AQUA
            .setTitle('Your Stats')
            .setDescription(`Rank: ${rank}\nPoints: ${userPoints}`);

        await interaction.reply({ embeds: [statsEmbed] });
        logger.info(`Displayed stats for user ${interaction.user.id} in guild ${guildId}`);
    } else {
        await interaction.reply('You do not have the necessary permissions to execute this command.');
        logger.warn(`Unauthorized command attempt by user ${interaction.user.id} in guild ${guildId}`);
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    client.destroy();
    process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    process.exit(1); // Optional: exit the process
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1); // Optional: exit the process
});
