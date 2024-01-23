"use strict"
/** This file contains methods for handling interactions with the openai api*/


/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export {};

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const { RECIPE_CONVERSION_BASE_PROMPT, SHORT_BASE_PROMPT } =require("./prompts");
const OpenAI =require("openai");
const jsonschema = require('jsonschema');
const recipeGeneratedSchema = require("../schemas/recipeGenerated.json");
const { BadRequestError } = require('../utils/expressError');

const openai = new OpenAI();

/** Accepts a string containing raw text for a recipe and returns an IRecipeBase
 *
 * IRecipeBase format:
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

async function textToRecipe(recipeText:string):Promise<IRecipeBase>{
  let recipe;

  if(recipeText.length>10){
    console.log("connecting to openai...");
    const completion = await openai.chat.completions.create({
      messages: [{
        role: "system",
        content: `${SHORT_BASE_PROMPT}${recipeText}`
      }],
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      temperature: 0
    });

    console.log(completion)
    const recipeData = completion.choices[0].message.content;
    recipe = JSON.parse(recipeData);
  }

  const validator = jsonschema.validate(
    recipe,
    recipeGeneratedSchema,
    {required: true}
  );

  if(!validator.valid) {
    const errs: string[] = validator.errors.map((e: Error) => e.stack);
    throw new BadRequestError(errs.join(", "));
  }

  return recipe;
}

module.exports = {textToRecipe}
