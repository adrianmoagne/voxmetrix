import dotenv from "dotenv";
dotenv.config();

import { Server } from "./core/server/server";

const PORT = process.env.PORT || 8080;

export const server = new Server(PORT);

// Only start the server if not in a test environment
if (process.env.NODE_ENV !== "test") {
	server.start();
}
