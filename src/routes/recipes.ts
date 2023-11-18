"use strict"

/** Routes for recipes */

import jsonschema from "jsonschema";
import express from "express";
import { BadRequestError } from "../utils/expressError.js";
import RecipeFactory from "../models/recipe.js";

import recipeNewSchema from "../schemas/recipeNew.json" assert { type: "json" };

const router = express.Router();

/** POST / {recipe} => {recipe}
 *
 * @params recipe: {name, description, sourceUrl, sourceName, steps[] }
 *         step: {stepNumber,instructions, ingredients[] }
 *         ingredient: {amount, description}
 *
 * @returns recipe: {recipeId, name, description, sourceUrl, sourceName, steps[] }
 *          step: {stepId, stepNumber,instructions, ingredients[] }
 *          ingredient: {ingredientId, amount, description}
 *
 * TODO: add Auth Required: loggedIn
 */

router.post("/", async function (req,res,next){
  console.log("you hit the route")
  const validator = jsonschema.validate(
    req.body,
    recipeNewSchema,
    {required:true}
  );
  if (!validator.valid){
    const errs :string[] = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs.join(", "));
  }

  const recipe = await RecipeFactory.saveRecipe(req.body);
  return res.status(201).json({recipe})
})


export default router;