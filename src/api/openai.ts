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
const MODEL = process.env.FINE_TUNED_MODEL_ID || "gpt-4o-2024-08-06"
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
    model: MODEL,
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
async function generateImage(recipe:string):Promise<string> {
  const prompt = `${RECIPE_IMAGE_PROMPT} ${recipe}`

  try{
    const result = await openai.images.generate({
      model: "gpt-image-2",
      prompt,
      size:"1536x1024",
    });

    const base64Data = result.data?.[0]?.b64_json;

      if (!base64Data) {
        throw new BadRequestError("We couldn't generate an image");
      }

      // Return the raw base64 string directly
      return base64Data;
  } catch (error) {
    throw new BadRequestError(
      `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}


export { textToRecipe, generateImage };
