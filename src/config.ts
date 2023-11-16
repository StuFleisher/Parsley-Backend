"use strict"

// import "dotenv/config.js";
import dotenv from "dotenv";

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

const OPENAI_API_KEY = process.env.API_KEY;
const PORT = +process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL

console.log("database:", process.env.DATABASE_URL)



export {
  DATABASE_URL,
  OPENAI_API_KEY,
  PORT,
};
