"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const dotenv = require("dotenv");
if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: '.env.test' });
}
else {
    dotenv.config();
}
const OPENAI_API_KEY = process.env.API_KEY;
const PORT = +process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;
console.log("database:", process.env.DATABASE_URL);
module.exports = {
    DATABASE_URL,
    OPENAI_API_KEY,
    PORT,
};
