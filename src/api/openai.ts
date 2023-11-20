"use strict"
/** This file contains methods for handling interactions with the openai api*/

// import { RECIPE_CONVERSION_BASE_PROMPT } from "./prompts.js";
// import OpenAI from "openai";

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export {};

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const { RECIPE_CONVERSION_BASE_PROMPT } =require("./prompts.js");
const OpenAI =require("openai");

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
 */

async function textToRecipe(recipeText:string):Promise<IRecipeBase>{
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
  const recipe = JSON.parse(recipeData);
  printRecipe(recipe.steps);
  return recipe;
}

/** Prints the recipe to the console for logging/troubleshooting */

function printRecipe(steps:IStep[]):void {
  for (const step of steps){
    console.log(step.stepNumber);
    for (const i of step.ingredients){
      console.log("* ", i.amount, i.description);
    }
    console.log("Instructions:",step.instructions)
  }
}

module.exports = {textToRecipe}
