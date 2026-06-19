const fs = require("fs");
const path = require("path");

module.exports = async function globalTeardown() {
	const instance = global.__MONGOINSTANCE;
	if (instance) {
		await instance.stop();
	}
	try {
		fs.unlinkSync(path.join(__dirname, ".jest-mongo-uri"));
	} catch {
		// ignore missing file
	}
};
