# EchoShout Documentation

## Overview
EchoShout is a Discord bot designed to measure and boost engagement in voice channels. It joins voice channels randomly, tracks user activity, and rewards users with points based on their presence.

---

## Main Files & Responsibilities

### 1. `index.js`
- **Purpose**: Core bot logic. Listens for Discord events and manages the bot’s main behavior.
- **Key Features**:
  - Initializes the bot client with necessary intents.
  - Handles events like `ready`, `guildCreate`, and `interactionCreate`.
  - Joins voice channels at random intervals, plays `scream.mp3`, and awards points.

### 2. `deploy-commands.js`
- **Purpose**: Deploys slash commands globally to Discord.
- **Usage**:
  - Run this file to register new or updated slash commands.

### 3. `database.js`
- **Purpose**: Manages database connections and stores server-specific configurations and leaderboard data.
- **Key Functions**:
  - `getServerData(guildId, callback)`: Retrieves server settings and leaderboard.
  - `saveServerData(guildId, data)`: Inserts or updates server data.

### 4. `logger.js`
- **Purpose**: Handles logging for the bot using Winston.
- **Features**:
  - Logs messages with timestamps in IST.
  - Stores logs in both `error.log` and `combined.log`.

### 5. `rateLimit.js`
- **Purpose**: Implements rate-limiting for slash commands to prevent abuse.
- **Key Logic**:
  - Limits commands per user within a time window.
  - Returns `true` if a user exceeds the limit.

### 6. `scream.mp3`
- **Purpose**: The audio file played by the bot upon joining a voice channel.

---

## Slash Commands

### Admin Commands
| Command              | Description                                |
|----------------------|--------------------------------------------|
| `/add_bot_channel`   | Adds a channel for the bot to join.        |
| `/remove_bot_channel`| Removes a channel from the bot’s list.     |
| `/set_frequency`     | Sets the interval for random VC joins.     |
| `/pause`             | Pauses the bot's activity.                |
| `/resume`            | Resumes the bot's activity.               |
| `/leaderboard`       | Exports a CSV file with leaderboard data.  |
| `/reset_stats`       | Clears the leaderboard and stats.         |

### User Commands
| Command    | Description                    |
|------------|--------------------------------|
| `/top`     | Displays the top 10 users.     |
| `/stats`   | Shows individual user stats.   |
| `/help`    | Lists available bot commands.  |

---

## Database Schema
- **Table Name**: `server_data`
- **Columns**:
  - `guild_id`: Primary key for server ID.
  - `bot_channels`: JSON array of bot-enabled voice channels.
  - `command_channel`: The designated text channel for commands.
  - `leaderboard`: JSON object storing user scores.
  - `frequency`: Interval (in seconds) for random VC joins.
  - `is_paused`: Boolean indicating pause status.

---

## Setup Instructions

### 1. Environment Variables
Ensure `.env` contains:
```plaintext
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
CLIENT_ID=YOUR_DISCORD_APP_CLIENT_ID
DB_HOST=localhost
DB_USER=myuser
DB_PASS=mypassword
DB_NAME=mydatabase
```

### 2. Install Dependencies
Run:
```bash
npm install
```

### 3. Deploy Commands
Run:
```bash
node deploy-commands.js
```

### 4. Start the Bot
Run:
```bash
node index.js
```

---

## Error Handling
### Graceful Shutdown
- Captures `SIGTERM` and uncaught exceptions to close the bot safely.

### Logging
- Errors are logged to `error.log` and console for easy debugging.

---

## Future Improvements
- Add a web-based leaderboard for better visualization.
- Allow dynamic bot channel management via a dashboard.
- Use SQLite for simpler database setups.
