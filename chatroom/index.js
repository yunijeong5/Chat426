import express from "express";
import cors from "cors";
import morgan from "morgan";
import { Server } from "socket.io";
import { randomBytes } from "crypto";
import database from "./database.js";
import logger from "./logger.js";

const PORT = process.env.PORT || 5000;
const ADMIN = "admin";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const expressServer = app.listen(PORT, () => {
	logger.info(`(${process.pid}) Chatroom Server: Listening on port ${PORT}`);
});

const io = new Server(expressServer, {
	// Needs cors because our frontend is hosted on different server
	cors: {
		origin: "*",
	},
});

app.get("/init", async (req, res) => {
	const chats = await database.read("chats");
	const users = await getAllUsers();
	logger.info(
		`(${process.pid}) Chatroom service: Load initial chat and user data from database.`
	);
	res.send({ chats, users });
});

app.post("/events", async (req, res) => {
	const { type, data } = req.body;
	if (type === "ChatModerated") {
		// data: sent by moderator. username, text, isAccepted
		const { username, text, userid, isAccepted } = data;

		// save new moderated chat in the database
		const msg = buildMessage(userid, username, text, isAccepted);
		await database.write("chats", msg);

		io.emit("message", msg);
		logger.info(
			`(${process.pid}) Chatroom service: ChatModerated event received. Sending moderated chat to user.`
		);
	} else if (type === "VoteChecked") {
		// data: sent by vote. array of all votes information
		io.emit("votes-updated", data);
		logger.info(
			`(${process.pid}) Chatroom service: VoteChecked event received. Sending updated votes to user.`
		);
	}
	res.send({ status: "OK" });
});

// socket.io: listen for events submitted from frontend
io.on("connection", (socket) => {
	const ID = socket.id; // userid

	// upon connection, emit only to user
	socket.emit("message", buildMessage(ID, ADMIN, "Welcome to Chat426!"));

	// upon connection, emit to all others (except for self)
	socket.on("enter-room", async (username) => {
		logger.info(
			`(${process.pid}) Chatroom service: User ${ID} entered the chat.`
		);
		// check if user already exists
		const activeUsers = await getAllUsers();
		if (activeUsers.includes(username)) {
			socket.emit("invalid-username");
			return;
		}

		const user = await activateUser(socket.id, username);

		// message to user who joined
		socket.emit(
			"message",
			buildMessage(ID, ADMIN, `You have joined the chat.`)
		);

		// message to everyone else
		socket.broadcast.emit(
			"message",
			buildMessage(ID, ADMIN, `${user.username} has joined the chat.`)
		);

		// update user list for the room user now joined
		io.emit("user-list", {
			users: await getAllUsers(),
		});
	});

	// when user disconnects, emit to all others
	socket.on("disconnect", async () => {
		const user = await getUser(socket.id);

		if (!user) return;

		// remove user from UsersState
		await userLeavesApp(user.userid);

		// send message
		io.emit(
			"message",
			buildMessage(ID, ADMIN, `${user.username} has left the chat.`)
		);

		// send updated user list
		io.emit("user-list", {
			users: await getAllUsers(),
		});

		logger.info(`(${process.pid}) User ${socket.id} disconnected.`);
	});

	// listen for a message event
	socket.on("message", async ({ username, text, userid }) => {
		// contact moderator service via event bus
		try {
			await fetch("http://event-bus:4000/events", {
				// await fetch("http://localhost:4000/events", {
				// event but url
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: "ChatCreated",
					data: { username, text, userid },
				}),
			});
			logger.info(
				`(${process.pid}) Chatroom Service: Emitted ChatCreated event.`
			);
		} catch (err) {
			logger.error(`(${process.pid}) Chatroom Service: ${err}`);
		}
	});

	// Listen for typing activity
	socket.on("activity", (username) => {
		socket.broadcast.emit("activity", username);
	});

	// Listen for clicking like button
	socket.on("vote-clicked", async ({ id, userid, username }) => {
		// contact vote service via event bus
		try {
			await fetch("http://event-bus:4000/events", {
				// await fetch("http://localhost:4000/events", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: "VoteClicked",
					data: { id, userid, username },
				}),
			});
			logger.info(
				`(${process.pid}) Chatroom Service: Emitted VoteClicked event.`
			);
		} catch (err) {
			logger.error(`(${process.pid}) Chatroom Service: ${err}`);
		}
	});
});

/**
 * NOTE
 * - io.emit(): to everyone connected to the server
 * - socket.emit(): to the connected user
 */

// does not impact user state
function buildMessage(socketid, username, text, accepted = true) {
	return {
		id: randomBytes(4).toString("hex"),
		userid: socketid,
		username,
		text,
		time: new Intl.DateTimeFormat("default", {
			hour: "numeric",
			minute: "numeric",
		}).format(new Date()),
		vote: 0,
		isAccepted: accepted,
	};
}

// user functions
const UsersState = {
	users: async () => await database.read("users"),
	setUsers: async function (newUsersArray) {
		// update database
		await database.write("users", { usersArray: newUsersArray });
	},
};

async function activateUser(userid, username) {
	const user = { userid, username };

	// filter: making sure there's no duplicate
	const activeUsers = await UsersState.users();
	UsersState.setUsers([
		...activeUsers.filter((user) => user.userid !== userid),
		user,
	]);
	return user;
}

async function userLeavesApp(userid) {
	const activeUsers = await UsersState.users();
	UsersState.setUsers(activeUsers.filter((user) => user.userid !== userid));
}

async function getUser(userid) {
	const activeUsers = await UsersState.users();
	return activeUsers.find((user) => user.userid === userid);
}

async function getAllUsers() {
	const activeUsers = await UsersState.users();
	return activeUsers.map((user) => user.username);
}
