const fs = require("fs");
const path = require("path");

require("dotenv").config();

// Point the app at the in-memory MongoDB started in jest.globalSetup.js.
const uriFile = path.join(__dirname, ".jest-mongo-uri");
if (fs.existsSync(uriFile)) {
	process.env.DB_URL = fs.readFileSync(uriFile, "utf8").trim();
}

// Provide sane defaults so the app boots in tests without a .env file.
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "auth_token";
process.env.API_PREFIX = process.env.API_PREFIX || "/api";
// Connect once; the in-memory DB is already up so no retries are needed.
process.env.MONGO_CONNECT_ATTEMPTS = process.env.MONGO_CONNECT_ATTEMPTS || "1";
