"use strict";
/** Database setup for parsley. */
// const { Client } = require("pg");
// const { getDatabaseUri } = require("./config");
import { Client } from "pg";
import { getDatabaseUri } from "./config";
const databaseUri = getDatabaseUri();
const db = new Client({
    connectionString: databaseUri,
});
async function connectDb() {
    // Jest replaces console.* with custom methods; get the real ones for this
    const { log, error } = require("console");
    try {
        await db.connect();
        log(`Connected to ${databaseUri}`);
    }
    catch (err) /* istanbul ignore next (ignore for coverage) */ {
        error(`Couldn't connect to ${databaseUri}`, err.message);
        process.exit(1);
    }
}
connectDb();
export default db;
