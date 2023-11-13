"use strict";
/** This file contains methods for handling interactions with the openai api*/
// const { RECIPE_CONVERSION_BASE_PROMPT, TEST_RECIPE_TEXT } =require("./prompts.js");
// const OpenAI =require("openai");
import { RECIPE_CONVERSION_BASE_PROMPT } from "./prompts.js";
import OpenAI from "openai";
const openai = new OpenAI();
async function requestRecipeJSON(recipeText) {
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
    console.log("openai response:", completion);
    console.log("openai response:", completion.choices[0].message.content);
    return completion.choices[0].message.content;
}
async function textToRecipe(recipeText) {
    console.log("attempting to convert text:", recipeText);
    const recipeData = await requestRecipeJSON(recipeText);
    console.log("attempting to parse JSON");
    const recipe = JSON.parse(recipeData);
    for (const step of recipe.steps) {
        console.log(step.step_number);
        for (const i of step.ingredients) {
            console.log(i.amount, i.ingredient_name);
        }
        console.log(step.instructions);
    }
}
// module.exports =  {textToRecipe}
export { textToRecipe };
