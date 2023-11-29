"use strict";

/** Routes for recipes */


/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };
import { Request, Response, NextFunction } from "express";

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const RecipeFactory = require('../models/recipe');
const express = require('express');
const { BadRequestError } = require('../utils/expressError');
const jsonschema = require('jsonschema');
const recipeNewSchema = require("../schemas/recipeNew.json");
const { textToRecipe } = require("../api/openai");

const router = express.Router();

/** POST /generate {recipeText}=>{recipeData}
 *
 * @params recipeText:
 *
 *  {
 *    recipeText: string (the copy/paste recipe from another source)
 *  }
 *
 * @returns JSON recipeData: IRecipeBase
 *  {
 *    name: string
 *    steps:[
 *      {
 *        stepNumber:number,
          instructions: string,
          ingredients:[
            {
              amount: string;
              description: string;
            }
          ],
        }
 *    ]
 *  }
 */
router.post("/generate", async function (req: Request, res: Response, next: NextFunction) {
  const rawRecipe = req.body.recipeText;
  let recipe;
  try {
    recipe = await textToRecipe(rawRecipe);
  } catch (err) {
    return res.status(400).json({
      message: "There was an issue processing your recipe",
      errors: err.message,
    });
  }
  return res.json({ recipe });
});


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

router.post("/", async function (req: Request, res: Response, next: NextFunction) {
  const validator = jsonschema.validate(
    req.body,
    recipeNewSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs: string[] = validator.errors.map((e: Error) => e.stack);
    throw new BadRequestError(errs.join(", "));
  }

  const recipe = await RecipeFactory.saveRecipe(req.body);
  return res.status(201).json({ recipe });
});


/** GET /[id] {id} => {recipe}
 *
 * @params id (unique recipeId)
 *
 * @returns recipe: {recipeId, name, description, sourceUrl, sourceName, steps[] }
 *          step: {stepId, stepNumber,instructions, ingredients[] }
 *          ingredient: {ingredientId, amount, description}
 *
 * TODO: add Auth Required: loggedIn
 */

router.get(
  "/:id",
  async function (req: Request, res: Response, next: NextFunction) {
    const recipe = await RecipeFactory.getRecipeById(+req.params.id);
    return res.json({ recipe });
  }
);


/** GET /
 *  Returns a list of all recipes without submodel data
 *
 * @returns recipes: [{recipeId, name, description, sourceUrl, sourceName},...]
 *
 *
 * TODO: add Auth Required: loggedIn
 */

router.get(
  "/",
  async function (req: Request, res: Response, next: NextFunction) {
    const recipes = await RecipeFactory.getAllRecipes();
    return res.json({ recipes });
  }
);



module.exports = router;
// export default router
