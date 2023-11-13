"use strict";
// const dotenv =require("dotenv");
import "dotenv/config.js";
// dotenv.config();
const OPENAI_API_KEY = process.env.API_KEY;
const PORT = +process.env.PORT || 3001;
/** Returns the correct database for the current environment */
function getDatabaseUri() {
    return (process.env.NODE_ENV === "test")
        ? "postgresql:///parsley_test"
        : process.env.DATABASE_URL || "postgresql:///parsely";
}
// module.exports = {
//   getDatabaseUri,
//   OPENAI_API_KEY,
//   PORT,
// }
;
export { getDatabaseUri, OPENAI_API_KEY, PORT, };
