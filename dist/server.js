"use strict";
import app from "./app.js";
import { PORT } from "./config.js";
// textToRecipe(TEST_RECIPE_TEXT);
app.listen(PORT, function () {
    console.log(`Started on http://localhost:${PORT}`);
});
