"use strict"
// import "dotenv/config.js";
// import dotenv from "dotenv";

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export {};

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const dotenv = require("dotenv");

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

const OPENAI_API_KEY = process.env.API_KEY;
const SECRET_KEY = process.env.SECRET_KEY;
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 13;
const PORT = +process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL

module.exports = {
  DATABASE_URL,
  OPENAI_API_KEY,
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
  PORT,
};
