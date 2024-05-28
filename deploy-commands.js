const { REST, Routes, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const commands = [
    {
        name: 'add_bot_channel',
        description: 'Add a voice channel for the bot to join',
        options: [
            {
                name: 'channel',
                type: 7, // Type 7 corresponds to CHANNEL
                description: 'The name of the voice channel',
                required: true,
            },
        ],
        default_member_permissions: PermissionsBitField.Flags.Administrator.toString(), // Restrict to administrators
    },
    {
        name: 'remove_bot_channel',
        description: 'Remove a voice channel from the bot\'s list',
        options: [
            {
                name: 'channel',
                type: 7, // Type 7 corresponds to CHANNEL
                description: 'The name of the voice channel',
                required: true,
            },
        ],
        default_member_permissions: PermissionsBitField.Flags.Administrator.toString(), // Restrict to administrators
    },
    {
        name: 'set_command_channel',
        description: 'Set the channel for bot commands',
        options: [
            {
                name: 'channel',
                type: 7, // Type 7 corresponds to CHANNEL
                description: 'The name of the command channel',
                required: true,
            },
        ],
        default_member_permissions: PermissionsBitField.Flags.Administrator.toString(), // Restrict to administrators
    },
    {
        name: 'set_frequency',
        description: 'Set the frequency of the bot joining the VC (in seconds)',
        options: [
            {
                name: 'seconds',
                type: 4, // Type 4 corresponds to INTEGER
                description: 'The frequency in seconds',
                required: true,
            },
        ],
        default_member_permissions: PermissionsBitField.Flags.Administrator.toString(), // Restrict to administrators
    },
    {
        name: 'pause',
        description: 'Pause the bot from joining the VC',
        default_member_permissions: PermissionsBitField.Flags.Administrator.toString(), // Restrict to administrators
    },
    {
        name: 'resume',
        description: 'Resume the bot to join the VC',
        default_member_permissions: PermissionsBitField.Flags.Administrator.toString(), // Restrict to administrators
    },
    {
        name: 'reset_stats',
        description: 'Reset the leaderboard and stats',
        default_member_permissions: PermissionsBitField.Flags.Administrator.toString(), // Restrict to administrators
    },
    {
        name: 'leaderboard',
        description: 'Extract the leaderboard data in CSV format',
        default_member_permissions: PermissionsBitField.Flags.Administrator.toString(), // Restrict to administrators
    },
    {
        name: 'top',
        description: 'Show the top 10 leaderboard',
    },
    {
        name: 'stats',
        description: 'Show your stats',
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
