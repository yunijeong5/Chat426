import express from "express";
import morgan from "morgan";
import cors from "cors";
import { profanity } from "./profanity.js"; // Array<string>
import logger from "./logger.js";

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.post("/events", async (req, res) => {
	const { type, data } = req.body;

	// listen for new comments
	if (type !== "ChatCreated") {
		res.send({ message: "Nothing to check." });
		return;
	}

	const moderated = { ...data, isAccepted: true };

	// scan comment for profanity words
	const textWords = data.text.split(/\s+/);

	for (const word of textWords) {
		const lowerCaseWord = word.toLowerCase();
		if (profanity.includes(lowerCaseWord)) {
			moderated.isAccepted = false;
			logger.warn(
				`(${process.pid}) Moderator Service: Chat ${data.id} used banned word(s).`
			);
			break;
		}
	}

	// send event to event bus
	try {
		await fetch("http://event-bus:4000/events", {
			// await fetch("http://localhost:4000/events", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: "ChatModerated",
				data: moderated,
			}),
		});
		logger.info(
			`(${process.pid}) Moderator Service: Emitted ChatModerated event.`
		);
	} catch (error) {
		logger.info(`(${process.pid}) Moderator Service: ${error}`);
		res.status(500).send({
			status: "ERROR",
			message: error,
		});
	}

	res.send(moderated);
});

app.listen(5001, () => {
	logger.info(`(${process.pid}) Moderator Listening on 5001`);
});
