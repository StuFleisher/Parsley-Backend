import express from 'express';
import { Request, Response, NextFunction } from 'express';
import jsonschema from 'jsonschema';
const router = express.Router();

//middleware
import readMultipart from '../middleware/multer';

//schemas
import recipeNewSchema from "../schemas/recipeNew.json";
import recipeUpdateSchema from "../schemas/recipeUpdate.json";

//modules
import RecipeManager from '../models/recipe';
import { BadRequestError } from '../utils/expressError';
import { generateImage, textToRecipe } from "../api/openai";
import {
  ensureMatchingUsernameOrAdmin,
  ensureLoggedIn,
  ensureOwnerOrAdmin,
  ensureMatchingOwnerOrAdmin,
} from '../middleware/auth';
import ImageHandler from '../utils/imageHandler';
import scrapeRecipeFromURL from '../api/agentQl';
import { TEMP_IMG_BASE_PATH, S3_DIR } from '../api/s3';


/** POST /generate {recipeText}=>{recipeData}
 *
 * Pulls text from either a json.body.recipeText or by interpreting text
 * from a multipart/formdata image.
 *
 * Generates an IRecipeBase and returns it to the user as json
 * {recipe:IRecipeBase}
 *
 * Errors if no text is provided or if the recipe generation fails.
 */
router.post(
  "/generate",
  ensureLoggedIn,
  readMultipart("image"),

  async function (req: Request, res: Response, next: NextFunction) {
    const method = req.query.method;
    let rawRecipe;

    if (method === "image") {
      if (req.file) {
        rawRecipe = await ImageHandler.getRecipeTextFromPhoto(req.file.buffer);
      } else {
        throw new BadRequestError("Generate from image requires an image");
      }
    } else if (method === "url") {
      if (req.body && req.body.url) {
        let scrapedRecipe = await scrapeRecipeFromURL(req.body.url);
        if (scrapedRecipe.data.recipes[0]) {
          rawRecipe = JSON.stringify(scrapedRecipe.data.recipes[0]);
        } else {
          throw new BadRequestError("We couldn't find a recipe on that page.  Did you enter the link correctly?");
        }
      }
    } else if (method === "text") {
      if (req.body && req.body.recipeText) {
        rawRecipe = req.body.recipeText;
      } else {
        throw new BadRequestError("Please provide recipe text");
      }
    }

    try {
      const [generatedRecipe, generatedImageUrl] = await Promise.all([
        textToRecipe(rawRecipe, res.locals.user!.username),
        generateImage(rawRecipe)
      ]);

      //Store generated image on s3 in a temp directory
      let imageBuffer = await ImageHandler.urlToBlob(generatedImageUrl);
      const basePath = `recipeImage/tmp/${res.locals.user!.username}`;
      await ImageHandler.uploadAllSizes(imageBuffer, basePath);

      let recipe = {
        ...generatedRecipe,
        imageSm: `${S3_DIR}${TEMP_IMG_BASE_PATH}${res.locals.user!.username}-sm`,
        imageMd: `${S3_DIR}${TEMP_IMG_BASE_PATH}${res.locals.user!.username}-md`,
        imageLg: `${S3_DIR}${TEMP_IMG_BASE_PATH}${res.locals.user!.username}-lg`,
      };

      return res.json({ recipe });
    } catch (err) {
      throw new BadRequestError(err.message);
    }
  });

router.post(
  "/:id/image/generate",
  ensureLoggedIn,
  async function (req: Request, res: Response, next: NextFunction) {
    const recipe = await RecipeManager.getRecipeById(+req.params.id);

    const imgUrl = await generateImage(recipe);
    const blob = await ImageHandler.urlToBlob(imgUrl)
    res.setHeader("Content-Type", "image/png");
    return res.send(Buffer.from(blob));
  }
);

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

router.post(
  "/",
  ensureMatchingOwnerOrAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    //TODO: test middleware
    const validator = jsonschema.validate(
      req.body,
      recipeNewSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs: (string | undefined)[] = validator.errors.map((e: Error) => e.stack);
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
 */

router.get(
  "/",
  async function (req: Request, res: Response, next: NextFunction) {
    const query = req.query.q;
    if (typeof query === "string") {
      const recipes = await RecipeManager.getAllRecipes(query);
      return res.json({ recipes });
    } else {
      const recipes = await RecipeManager.getAllRecipes();
      return res.json({ recipes });
    }
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
  ensureOwnerOrAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const deleted = await RecipeManager.deleteRecipeById(+req.params.id);
    return res.json({ deleted });
  }
);

/** PUT /[id]
 * Updates a recipe and its submodel data
 *
 * @returns recipe: {recipeId, name, description, sourceUrl, sourceName, imageUrl, steps[] }
 *          step: {stepId, stepNumber,instructions, ingredients[] }
 *          ingredient: {ingredientId, amount, description}
 */
router.put(
  "/:id",
  ensureOwnerOrAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    //TODO: update validation
    //TODO: test middleware

    const validator = jsonschema.validate(
      req.body,
      recipeUpdateSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs: (string | undefined)[] = validator.errors.map((e: Error) => e.stack);
      throw new BadRequestError(errs.join(", "));
    }
    const recipe = await RecipeManager.updateRecipe(req.body);
    return res.json({ recipe });
  }
);

/** PUT /[id]/image
 * Expects a Content:multipart/form-data
 * Stores the attached image in s3 and updates the imageUrl accordingly
 */

//TODO: testing
router.put(
  "/:id/image",
  ensureOwnerOrAdmin,
  readMultipart('image'),
  async function (req: Request, res: Response, next: NextFunction) {
    //TODO: test middleware

    if (!req.file) { throw new BadRequestError('Please attach an image'); }
    const recipe = await RecipeManager.updateRecipeImage(
      req.file,
      +req.params.id
    );

    return res.json({
      imageSm: recipe.imageSm,
      imageMd: recipe.imageMd,
      imageLg: recipe.imageLg
    });
  }
);

/** DELETE /[id]/image
 * Deletes the image associated with the recipeId in params from s3
 * and updates the imageUrl accordingly.
 */
//TODO: testing
router.delete(
  "/:id/image",
  ensureOwnerOrAdmin,
  async function (req: Request, res: Response, next: NextFunction) {

    const updatedRecipe = await RecipeManager.deleteRecipeImage(+req.params.id);
    return res.json({ updatedRecipe });
  }
);


/************************** FAVORITE ACTIONS */

/** POST / {recipe} => {recipe}
 *
 * @body {username} => username for the favorite to edit
 * @params id:number => recipeId for the recipe to add
 *
 * @returns favorite:
 * {favoriteId, recipeId, username}
 */

router.post("/:id/addToFavorites",
  ensureMatchingUsernameOrAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    //TODO: test middleware

    const { username } = req.body;
    const created = await RecipeManager
      .addToFavorites(+req.params.id, username);

    return res.status(201).json({ created });
  });

/** POST / {recipe} => {recipe}
 *
 * @body {username} => username for the favorite to edit
 * @params id:number => recipeId for the recipe to remove
 *
 * @returns {"removed": { recipeId, username }}
 */

router.post("/:id/removeFromFavorites",
  ensureMatchingUsernameOrAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    //TODO: test middleware

    const { username } = req.body;
    await RecipeManager.removeFromFavorites(+req.params.id, username);

    return res.json({
      "removed": {
        recipeId: +req.params.id,
        username: username,
      }
    });
  });


export default router;
