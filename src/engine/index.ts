// CONNECT HERE: the screen imports run() only from this file.
// Default is the mock engine. To use the real server engine, set NEXT_PUBLIC_ENGINE=server in .env.local (and in Vercel settings).
import { run as mock } from "./mockEngine";
import { run as server } from "./client";
export const run = process.env.NEXT_PUBLIC_ENGINE === "server" ? server : mock;
