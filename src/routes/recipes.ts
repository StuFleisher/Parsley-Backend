"use strict";

/** Routes for recipes */


/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };
import { Request, Response, NextFunction } from "express";

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const RecipeManager = require('../models/recipe');
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

  const recipe = await RecipeManager.saveRecipe(req.body);
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
    const recipe = await RecipeManager.getRecipeById(+req.params.id);
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
    const recipes = await RecipeManager.getAllRecipes();
    return res.json({ recipes });
  }
);

/** DELETE /[id]
 *  Deletes a recipe and its submodel data
 *
 * @returns deleted: {recipeId, name, description, sourceUrl, sourceName, steps[] }
 *          step: {stepId, stepNumber,instructions, ingredients[] }
 *          ingredient: {ingredientId, amount, description}
*/

router.delete(
  "/:id",
  async function (req: Request, res: Response, next: NextFunction){
    const deleted = await RecipeManager.deleteRecipeById(+req.params.id);
    return res.json({deleted})
  }
)

/** PUT /[id]
 * Updates a recipe and its submodel data
 *
 * @returns recipe: {recipeId, name, description, sourceUrl, sourceName, steps[] }
 *          step: {stepId, stepNumber,instructions, ingredients[] }
 *          ingredient: {ingredientId, amount, description}
 */
router.put(
  "/:id",
  async function (req: Request, res: Response, next: NextFunction){
    //TODO: update validation
    // const validator = jsonschema.validate(
    //   req.body,
    //   recipeNewSchema,
    //   { required: true }
    // );
    // if (!validator.valid) {
    //   const errs: string[] = validator.errors.map((e: Error) => e.stack);
    //   throw new BadRequestError(errs.join(", "));
    // }
    const recipe = await RecipeManager.updateRecipe(req.body);
    return res.json({ recipe });
  }
)

module.exports = router;
// export default router
