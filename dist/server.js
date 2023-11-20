"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const app = require("./app");
const { PORT } = require("./config");
const { textToRecipe } = require("./api/openai");
const { TEST_RECIPE_TEXT } = require("./api/prompts");
// textToRecipe(TEST_RECIPE_TEXT);
app.listen(PORT, function () {
    console.log(`Started on http://localhost:${PORT}`);
});
