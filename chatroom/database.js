import { MongoClient } from "mongodb";
import logger from "./logger.js";

const url = "mongodb://admin:secret@db:27017";
const client = new MongoClient(url);
const chatsDB = "chats";
const usersDB = "users";

let users;
let chats;

const userCollection = async () => {
	if (!users) {
		await client.connect();
		const db = client.db(usersDB);
		users = db.collection(usersDB);
	}
	return users;
};

const chatCollection = async () => {
	if (!chats) {
		await client.connect();
		const db = client.db(chatsDB);
		chats = db.collection(chatsDB);
	}
	return chats;
};

// dataType: 'users' | 'chats'
const read = async (dataType) => {
	try {
		const collection =
			dataType === "users"
				? await userCollection()
				: await chatCollection();
		const docs = await collection.find({}).toArray(); // {}: find all documents in the collection
		logger.info(
			`(${process.pid}) Chatroom service: Reading ${dataType} collection.`
		);
		return dataType === "users" ? docs[0]?.usersArray || [] : docs || []; // default if docs is undefined: []
	} catch (err) {
		logger.error(err);
	}
};

// dataType: 'users' | 'chats'
// 'users' case: data is an object with schema of {"usersArray": [Array of user objects]}
// 'chats' case: data is one chat object created with buildMessage(...)
const write = async (dataType, data) => {
	try {
		const collection =
			dataType === "users"
				? await userCollection()
				: await chatCollection();
		if (dataType === "users") {
			await collection.deleteMany({});
		}
		await collection.insertOne(data);
		logger.info(
			`(${process.pid}) Chatroom service: Writing to ${dataType} collection.`
		);
	} catch (err) {
		logger.error(err);
	}
};

// TESTING;
// const demoChats = [];
// let demoUsers = [{ usersArray: [] }];
// const read = (dataType) => {
// 	return dataType === "users" ? demoUsers[0].usersArray : demoChats;
// };
// const write = (dataType, data) => {
// 	dataType === "users" ? (demoUsers = [data]) : demoChats.push(data);
// };

export default { read, write };
