import express from "express";
import cors from "cors";
import morgan from "morgan";
import database from "./database.js";
import logger from "./logger.js";

// create express app
const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.get("/init", async (req, res) => {
	const votes = await database.read();
	logger.info(`(${process.pid}) Load initial votes: ${votes}`);
	res.send(votes);
});

app.post("/events", async (req, res) => {
	// data: id, userid, username
	const { type, data } = req.body;
	const { id, userid, username } = data;

	// listen for new comments
	if (type !== "VoteClicked") {
		res.send({ message: "Nothing to check." });
		return;
	}

	const votes = await database.read();

	// chat was never liked before (e.g. does not exist in the database yet)
	if (votes[id] === undefined) {
		votes[id] = {
			id,
			total: 1,
			votedBy: [{ username, userid }],
		};
	}
	// chat was voted before. check if this user already liked the chat
	else {
		const foundIndex = votes[id].votedBy.findIndex(
			(userObj) => userObj.userid === userid
		);

		// hasn't vote for this chat before. Increase vote and add user info to votedBy array
		if (foundIndex === -1) {
			votes[id].total += 1;
			votes[id].votedBy.push({ username, userid });
		}
		// already voted for this chat. Decrease vote and remove user info from votedBy array
		else {
			votes[id].total -= 1;
			votes[id].votedBy.splice(foundIndex, 1);
		}
	}

	// update DB
	await database.write(votes);

	// send event to event bus
	try {
		await fetch("http://event-bus:4000/events", {
			// await fetch("http://localhost:4000/events", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: "VoteChecked",
				data: votes,
			}),
		});
		logger.info(
			`(${process.pid}) Vote Service: Emitted VoteChecked event.`
		);
	} catch (error) {
		logger.error(`(${process.pid}) Vote Service: ${error}`);
		res.status(500).send({
			status: "ERROR",
			message: error,
		});
	}
	res.send(votes);
});

app.listen(5002, () => {
	logger.info(`(${process.pid}) Vote service: Listening on port 5002`);
});
