# EchoShout (Discord Bot)

## Overview
EchoShout is a Discord bot designed to:
- **Randomly join voice channels** at set intervals.
- **Track user presence** in the voice channel, awarding points for being present.
- **Generate a leaderboard** of top active users.

## Features
1. **Random Intervals**  
   Joins a specified voice channel after a random delay within a user-defined time window.
2. **User Tracking**  
   Collects stats (points) for each user who is present in the voice channel when the bot joins.
3. **Leaderboard**  
   Allows admins to export a CSV file of the current leaderboard or display top users.
4. **Admin Slash Commands**  
   - `/add_bot_channel` and `/remove_bot_channel`  
   - `/set_command_channel`  
   - `/set_frequency`  
   - `/pause` and `/resume`  
   - `/reset_stats`  
   - `/leaderboard`

## Project Structure
```
.
├── .gitignore
├── database.js
├── deploy-commands.js
├── index.js
├── logger.js
├── package.json
├── package-lock.json
├── scream.mp3
└── ...
```

## Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/username/EchoShout.git
   cd EchoShout
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` File**  
   In the root folder, create a file named `.env` with:
   ```bash
   DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
   CLIENT_ID=YOUR_DISCORD_APP_CLIENT_ID
   DB_HOST=localhost
   DB_USER=myuser
   DB_PASS=mypassword
   DB_NAME=mydatabase
   ```
   Adjust values as needed.

4. **Deploy Slash Commands**
   ```bash
   node deploy-commands.js
   ```

5. **Start the Bot**
   ```bash
   node index.js
   ```
   The bot will connect to Discord, create a database table if needed, and begin random channel joins.

## Usage
1. **Invite the Bot**  
   Generate an invite link with proper permissions (Administrator or relevant slash command perms).

2. **Configure the Bot**  
   Use slash commands (like `/set_frequency <seconds>`) in your specified command channel.

3. **Check Stats**  
   - `/top` to see the top 10.  
   - `/stats` to see your individual rank and points.

4. **Export Leaderboard**  
   - `/leaderboard` sends a CSV file in the channel.

## Contributing
- Fork the repo and create feature branches.
- Create pull requests for new changes or improvements.

