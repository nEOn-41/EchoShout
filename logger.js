const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

// Define custom log format
const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
    level: 'info',
    format: combine(
        label({ label: 'DiscordBot' }),
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.Console(), // Log to the console
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' })
    ],
});

module.exports = logger;
