import dotenv from "dotenv"

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

const OPENAI_API_KEY = process.env.API_KEY;
const SECRET_KEY = process.env.SECRET_KEY;
const DATABASE_URL = process.env.DATABASE_URL

const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 13;
const PORT = +process.env.PORT || 3001;

export {
  DATABASE_URL,
  OPENAI_API_KEY,
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
  PORT,
};
