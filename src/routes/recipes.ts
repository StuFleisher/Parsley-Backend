"use strict"

/** Routes for recipes */

// import jsonschema from "jsonschema";
// import express from "express";
// import { BadRequestError } from "../utils/expressError";
// import RecipeFactory from "../models/recipe";

// import recipeNewSchema from "../schemas/recipeNew.json" assert { type: "json" };

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export {};
import { ErrorRequestHandler,Request, Response, NextFunction } from "express";

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const jsonschema = require('jsonschema');
const express = require('express');
const {BadRequestError} = require('../utils/expressError');
const RecipeFactory = require('../models/recipe')
const recipeNewSchema = require("../schemas/recipeNew.json");


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

router.post("/", async function (req:Request, res:Response, next:NextFunction){
  console.log("you hit the route")
  const validator = jsonschema.validate(
    req.body,
    recipeNewSchema,
    {required:true}
  );
  if (!validator.valid){
    const errs :string[] = validator.errors.map((e:Error) => e.stack);
    throw new BadRequestError(errs.join(", "));
  }

  const recipe = await RecipeFactory.saveRecipe(req.body);
  return res.status(201).json({recipe})
})


module.exports = router;
// export default router
