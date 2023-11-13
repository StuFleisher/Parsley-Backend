"use strict";
//load modules
// const app = require("./app.js");
// const {PORT} = require("./config.js");
// const {textToRecipe} = require("./api/openai.js");
// const {textToRecipe} = require("./api/openai.js");
import app from "./app.js";
import { PORT } from "./config.js";
// textToRecipe(TEST_RECIPE_TEXT);
console.log("running");
app.listen(PORT, function () {
    console.log(`Started on http://localhost:${PORT}`);
});
