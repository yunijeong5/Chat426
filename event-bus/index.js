import express from "express";
import cors from "cors";
import morgan from "morgan";
import winston from "winston";

// create express app
const app = express();

// configure winston logger
const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.simple()
	),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({
			filename: "../logs/combined.log",
		}),
	],
});

// add middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

const servicePorts = [
	{ name: "chatroom", port: 5000 },
	{ name: "moderator", port: 5001 },
	{ name: "vote", port: 5002 },
];

app.post("/events", async (req, res) => {
	const event = req.body;

	logger.info(`(${process.pid}) Event Bus (Received Event) ${event.type}`);

	for (const { name, port } of servicePorts) {
		try {
			logger.info(
				`(${process.pid}) Event Bus (Sending Event to ${port}) ${event.type}`
			);

			await fetch(`http://${name}:${port}/events`, {
				// await fetch(`http://localhost:${port}/events`, {
				method: "POST",
				body: JSON.stringify(event),
				headers: { "Content-Type": "application/json" },
			});
		} catch (err) {
			logger.error(err);
		}
	}

	res.send({ status: "OK" });
});

// listen on port 5000
app.listen(4000, () => {
	logger.info(`(${process.pid}) Event bus: Listening on port 4000`);
});
