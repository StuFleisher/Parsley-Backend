"use strict";
// import app from "./app.js";
// import { PORT } from "./config.js";
// import { textToRecipe } from "./api/openai.js";
// import { TEST_RECIPE_TEXT } from "./api/prompts.js";

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export {};

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const app = require("./app");
const {PORT} = require("./config");
const {textToRecipe} = require("./api/openai");
const {TEST_RECIPE_TEXT} = require("./api/prompts");

// textToRecipe(TEST_RECIPE_TEXT);
app.listen(PORT, function () {
  console.log(`Started on http://localhost:${PORT}`);
});
