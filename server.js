"use strict";

//load modules
import app from "./app.js";
import { PORT } from "./config.js";
import { textToRecipe } from "./api/openai.js";
import { TEST_RECIPE_TEXT } from "./api/prompts.js";

textToRecipe(TEST_RECIPE_TEXT);

app.listen(PORT, function () {
  console.log(`Started on http://localhost:${PORT}`);
});
