const fs = require("fs");
const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server");


module.exports = async function globalSetup() {
	const instance = await MongoMemoryServer.create();
	global.__MONGOINSTANCE = instance;
	fs.writeFileSync(path.join(__dirname, ".jest-mongo-uri"), instance.getUri());
};
