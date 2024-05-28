const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bot_data.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS server_data (
        guild_id TEXT PRIMARY KEY,
        bot_channels TEXT,
        command_channel TEXT,
        leaderboard TEXT,
        frequency INTEGER,
        is_paused INTEGER
    )`);
});

const getServerData = (guildId, callback) => {
    db.get(`SELECT * FROM server_data WHERE guild_id = ?`, [guildId], (err, row) => {
        if (err) {
            console.error(err.message);
            callback(null);
        } else {
            callback(row);
        }
    });
};

const saveServerData = (guildId, data) => {
    const { botChannels, commandChannel, leaderboard, frequency, isPaused } = data;
    db.run(`INSERT OR REPLACE INTO server_data (guild_id, bot_channels, command_channel, leaderboard, frequency, is_paused) VALUES (?, ?, ?, ?, ?, ?)`,
        [guildId, JSON.stringify(botChannels), commandChannel, JSON.stringify(leaderboard), frequency, isPaused ? 1 : 0],
        (err) => {
            if (err) {
                return console.error(err.message);
            }
        }
    );
};

module.exports = { getServerData, saveServerData };
