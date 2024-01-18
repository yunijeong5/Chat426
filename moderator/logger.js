import winston from "winston";

const logFile = process.env.LOG_FILE || "default.log";

const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.simple()
	),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({
			filename: logFile,
		}),
	],
});

export default logger;
