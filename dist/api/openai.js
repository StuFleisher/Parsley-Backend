"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const { RECIPE_CONVERSION_BASE_PROMPT } = require("./prompts.js");
const OpenAI = require("openai");
const jsonschema = require('jsonschema');
const recipeGeneratedSchema = require("../schemas/recipeGenerated.json");
const openai = new OpenAI();
/** Accepts a string containing raw text for a recipe and returns an IRecipe
 *
 * IRecipe format:
 * {
 *  name: string,
 *  steps: [{
 *    step_number: number,
 *    ingredients: {amount: string, description: string},
 *    instructions: string
 *  },{step2},{step3}...]
 * }
 *
 * Throws an error if chat gpt cannot format the recipe correctly
 */
async function textToRecipe(recipeText) {
    let recipe;
    if (recipeText.length > 10) {
        console.log("connecting to openai...");
        const completion = await openai.chat.completions.create({
            messages: [{
                    role: "system",
                    content: `${RECIPE_CONVERSION_BASE_PROMPT}${recipeText}`
                }],
            model: "gpt-3.5-turbo-1106",
            response_format: { type: "json_object" },
            temperature: 0
        });
        const recipeData = completion.choices[0].message.content;
        recipe = JSON.parse(recipeData);
    }
    const validator = jsonschema.validate(recipe, recipeGeneratedSchema, { required: true });
    if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new Error(errs.join(", "));
    }
    // printRecipe(recipe.steps);
    return recipe;
}
/** Prints the recipe to the console for logging/troubleshooting */
function printRecipe(steps) {
    for (const step of steps) {
        console.log(step.stepNumber);
        for (const i of step.ingredients) {
            console.log("* ", i.amount, i.description);
        }
        console.log("Instructions:", step.instructions);
    }
}
module.exports = textToRecipe;
