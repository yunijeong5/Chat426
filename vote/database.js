import { MongoClient } from "mongodb";
import logger from "./logger.js";

const url = "mongodb://admin:secret@db:27017";
const client = new MongoClient(url);
const votesDB = "votes";

let votes;
const voteCollection = async () => {
	if (!votes) {
		await client.connect();
		const db = client.db(votesDB);
		votes = db.collection(votesDB);
	}
	return votes;
};

const read = async () => {
	try {
		const collection = await voteCollection();
		const docs = await collection.find({}).toArray(); // {}: find all documents in the collection
		logger.info(`(${process.pid}) Vote Service: Reading votes collection.`);
		return docs[0] || {}; // default if docs is undefined: {}
	} catch (err) {
		logger.error(err);
	}
};

const write = async (data) => {
	try {
		const collection = await voteCollection();
		await collection.deleteMany({}); // delete everything
		await collection.insertOne(data);
		logger.info(
			`(${process.pid}) Vote Service: Writing to votes collection.`
		);
	} catch (err) {
		logger.error(err);
	}
};

// TESTING
// let demoVotes = {};

// const read = () => {
// 	return demoVotes;
// };
// const write = (data) => {
// 	demoVotes = data;
// };

export default { read, write };
