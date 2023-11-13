"use strict"
/** This file contains methods for handling interactions with the openai api*/

interface IRecipe {
  name:string;
  steps:IStep[];
}

interface IStep {
  step_number:number,
  ingredients:IIngredient[],
  instructions: string
}

interface IIngredient {
  amount: string;
  description: string;
}


import { Interface } from "readline";

import { RECIPE_CONVERSION_BASE_PROMPT, TEST_RECIPE_TEXT } from "./prompts.js";
import OpenAI from "openai";

const openai = new OpenAI();

async function requestRecipeJSON(recipeText:string) {

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
  return completion.choices[0].message.content;
}

async function textToRecipe(recipeText:string){
  const recipeData = await requestRecipeJSON(recipeText);
  const recipe = JSON.parse(recipeData);

  printRecipe(recipe.steps)

}

function printRecipe(steps:IStep[]):void {
  for (const step of steps){
    console.log(step.step_number);
    for (const i of step.ingredients){
      console.log(i.amount, i.description);
    }
    console.log(step.instructions)
  }
}

export {textToRecipe}
