"use strict"
/** This file contains methods for handling interactions with the openai api*/

import { RECIPE_CONVERSION_BASE_PROMPT, SHORT_BASE_PROMPT } from "./prompts";
import OpenAI from "openai";
import jsonschema from 'jsonschema';
import recipeGeneratedSchema from "../schemas/recipeGenerated.json";
import { BadRequestError } from '../utils/expressError';

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

    console.log(completion.choices[0].message.content)
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

export {textToRecipe}
