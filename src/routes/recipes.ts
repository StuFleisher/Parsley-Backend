import express from 'express';
import { Request, Response, NextFunction } from 'express';
import jsonschema from 'jsonschema';
const router = express.Router();

//middleware
import readMultipart from '../middleware/multer';

//schemas
import recipeNewSchema from "../schemas/recipeNew.json"
import recipeUpdateSchema from "../schemas/recipeUpdate.json";

//modules
import RecipeManager from '../models/recipe';
import { BadRequestError } from '../utils/expressError';
import { textToRecipe } from "../api/openai";



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
    const errs: (string|undefined)[] = validator.errors.map((e: Error) => e.stack);
    throw new BadRequestError(errs.join(", "));
  }

  const recipe = await RecipeManager.saveRecipe(req.body);
  return res.status(201).json({ recipe });
});


/** GET /[id] {id} => {recipe}
 *
 * @params id (unique recipeId)
 *
 * @returns
 *      recipe:
 *      {recipeId, name, description, sourceUrl, sourceName, imageUrl, steps[] }
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
 * @returns recipes: [{recipeId, name, description, sourceUrl, sourceName, imageUrl},...]
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
 * @returns deleted: {recipeId, name, description, sourceUrl, sourceName, imageUrl, steps[] }
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
 * @returns recipe: {recipeId, name, description, sourceUrl, sourceName, imageUrl, steps[] }
 *          step: {stepId, stepNumber,instructions, ingredients[] }
 *          ingredient: {ingredientId, amount, description}
 */
router.put(
  "/:id",
  async function (req: Request, res: Response, next: NextFunction){
    //TODO: update validation
    const validator = jsonschema.validate(
      req.body,
      recipeUpdateSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs: (string|undefined)[] = validator.errors.map((e: Error) => e.stack);
      throw new BadRequestError(errs.join(", "));
    }
    const recipe = await RecipeManager.updateRecipe(req.body);
    return res.json({ recipe });
  }
)

/** PUT /[id]/image
 * Expects a Content:multipart/form-data
 * Stores the attached image in s3 and updates the imageUrl accordingly
 */

//TODO: testing
router.put(
  "/:id/image",
  readMultipart('image'),
  async function(req: Request, res: Response, next: NextFunction){

    if (!req.file){throw new BadRequestError('Please attach an image')}
    const recipe = await RecipeManager.updateRecipeImage(
      req.file,
      +req.params.id
    )

    return res.json({imageUrl:recipe.imageUrl});
  }
)

/** DELETE /[id]/image
 * Deletes the image associated with the recipeId in params from s3
 * and updates the imageUrl accordingly.
 */
//TODO: testing
router.delete(
  "/:id/image",
  async function(req: Request, res: Response, next: NextFunction){

    const deleted = await RecipeManager.deleteRecipeImage(+req.params.id)
    return res.json({deleted});
  }
)



export default router
