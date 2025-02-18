"use strict";
/** This file contains methods for handling interactions with the openai api*/
import '../config';

import { SHORT_BASE_PROMPT, RECIPE_IMAGE_PROMPT } from "./prompts";
import OpenAI from "openai";
import jsonschema from 'jsonschema';
import recipeGeneratedSchema from "../schemas/recipeGenerated.json";
import { BadRequestError } from '../utils/expressError';
import prisma from '../prismaClient';

const openai = new OpenAI();


/** Handles generation/formatting from raw recipe text.
 * Accepts a string containing raw text for a recipe and returns an IRecipeBase
 *
 * Throws an error if chat gpt cannot format the recipe correctly
 */

async function textToRecipe(recipeText: string, username:string): Promise<IRecipeBase> {
  let recipe;

  if (recipeText.length < 10) { throw new BadRequestError("Request too short"); }

  console.log("connecting to openai...");
  const completion = await openai.chat.completions.create({
    messages: [{
      role: "system",
      content: `${SHORT_BASE_PROMPT}${recipeText}`
    }],
    model: "gpt-4o-2024-08-06",
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "recipeResponse",
        strict: true,
        schema: recipeGeneratedSchema
      }
     },
    temperature: 0
  });

  let recipeData = completion.choices[0].message.content;
  if (recipeData === null) throw new Error("Open AI conversation error");
  recipe = JSON.parse(recipeData);
  try {
    validateRecipe(recipe);
    logGenerateRequest(recipeText,recipeData,false,null,true, username)
  } catch (err) {
    console.log("First recipe failed to validate. Retrying.")
    //continue with retry
  }
  return recipe;
}


/**Takes a recipe and validates it against the recipeGeneratedSchema.
 * Returns true if validation succeeds, or throws an error if the validation
 * fails.
 * */
function validateRecipe(recipe: any) {
  const validator = jsonschema.validate(
    recipe,
    recipeGeneratedSchema,
    { required: true }
  );

  if (validator.valid) return true;

  const errs: (string | undefined)[] = validator.errors.map((e: Error) => e.stack);
  throw new BadRequestError(errs.join(", "));
}


/** Saves a record of the generation request in the database.  Returns void. */
async function logGenerateRequest(
  requestText:string,
  response:string,
  didRetry:boolean,
  retryResponse:string|null,
  success:boolean,
  requestedBy:string,
){
  try{
    const generationRequest = await prisma.generationRequest.create({
      data:{
        requestText,
        response,
        didRetry,
        retryResponse,
        success,
        requestedBy,
      }
    })
  } catch(err){
    console.log(err.message);
  }
}

//Image Generation
async function generateImage(recipe:IRecipeWithMetadata):Promise<string> {
  const prompt = `${RECIPE_IMAGE_PROMPT} Title: ${recipe.name} Description: ${recipe.description}`

  const image = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    size:"1792x1024",
  });

  if (!image.data[0].url) throw new BadRequestError("We couldn't generate that an image")
  return image.data[0].url
}


export { textToRecipe, generateImage };
