
import '../config';
import prisma from '../prismaClient';
import { NotFoundError, BadRequestError } from '../utils/expressError';
import StepManager from './step';
import { deleteFile } from "../api/s3";
import ImageHandler from '../utils/imageHandler';

const DEFAULT_IMG_URL = "https://sf-parsley.s3.amazonaws.com/recipeImage/default";


/** Data and functionality for recipes */

class RecipeManager {

  /** Create a recipe from data, store it to the database, then return data
   * from the new record
   *
   * @param: clientRecipe - The recipe data including all metadata and submodels
   * but not including system generated data (like id).
   * @returns: RecipeData (Promise) - Full recipe data including system generated
   * fields
   *  */

  static async saveRecipe(clientRecipe: RecipeForCreate): Promise<RecipeData> {

    const {
      name,
      description,
      sourceUrl,
      sourceName,
      imageSm,
      imageMd,
      imageLg,
      owner,
      steps
    } = clientRecipe;

    const createdRecipe = await prisma.recipe.create({
      data: {
        name,
        description,
        sourceUrl,
        sourceName,
        imageSm,
        imageMd,
        imageLg,
        owner,
      }
    });

    for (const step of steps) {
      await StepManager.createStep({
        recipeId: createdRecipe.recipeId,
        stepNumber: step.stepNumber,
        ingredients: step.ingredients,
        instructions: step.instructions,
      });
    }

    return await prisma.recipe.findUniqueOrThrow({
      where: { recipeId: createdRecipe.recipeId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            ingredients: {
              orderBy: { ingredientId: 'asc' },
            }
          }
        }
      }
    });

  }

  /** Fetches a list of all recipes from the database. Does not include submodel
   *  data (steps or ingredients)
   *
   * @returns: SimpleRecipeData[] (Promise)
   *  {recipeId, name, description, sourceUrl, sourceName}
   * */

  static async getAllRecipes(query?: string): Promise<SimpleRecipeData[]> {
    if (!query) { return await prisma.recipe.findMany({orderBy:{ createdTime: 'desc' }}); }

    const cleanQuery = query.split(/\s+/g).join("&");

    let recipe: SimpleRecipeData[] = await prisma.recipe.findMany({
      where: {
        OR: [
          { name: { search: cleanQuery } },
          { description: { search: cleanQuery } },
          { steps: { some: { instructions: { search: cleanQuery } } } },
          { steps: { some: { ingredients: { some: { description: { search: cleanQuery } } } } } },
        ]
      },
      orderBy: [
        {
          _relevance: {
            fields: ["name", "description"],
            search: cleanQuery,
            sort: 'desc',
          }
        },
      ]
    })

    return recipe;
  }


  /** Fetches and returns a single recipe record and its submodels from the
   * database by recipeId.
   *
   * @param: id : number --> The recipeId to query
   * @returns: RecipeData (Promise)
   * {recipeId, name, description, sourceUrl, sourceName, steps}
   *
   * Throws an error if record is not found.
  */

  static async getRecipeById(id: number): Promise < RecipeData > {
  try {
    const recipe = await prisma.recipe.findUniqueOrThrow({
      where: {
        recipeId: id
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            ingredients: { orderBy: { ingredientId: 'asc' } },
          }
        }
      }
    });
    return recipe;
  } catch(err) {
    console.log("catching error");
    //use our custom error instead
    throw new NotFoundError("Recipe not found");
  }

};


  /**Fetches and updates a single recipe record and its submodel data
   * Returns the updated RecipeData
   *
   * @param: id : number
   * @returns: RecipeData (Promise)
   * {recipeId, name, description, sourceUrl, sourceName, steps}
   *
   * Throws an error if record is not found.
   */

  static async updateRecipe(newRecipe: IRecipeForUpdate): Promise < RecipeData > {

  //TODO: handle id from url param, not request body
  //TODO: prevent manual changes to stepId & ingredientId
  let updatedRecipe: RecipeData;
  const currentRecipe: RecipeData = (
    await RecipeManager.getRecipeById(newRecipe.recipeId)
  );

  try {
    await prisma.$transaction(async () => {
      //Update base recipe data
      await prisma.recipe.update({
        where: { recipeId: currentRecipe.recipeId },
        data: {
          name: newRecipe.name,
          description: newRecipe.description,
          sourceName: newRecipe.sourceName,
          sourceUrl: newRecipe.sourceUrl,
          imageSm: newRecipe.imageSm,
          imageMd: newRecipe.imageMd,
          imageLg: newRecipe.imageLg,
        },
      });

      const temp = await RecipeManager._updateRecipeSteps(
        currentRecipe.steps,
        newRecipe.steps,
        newRecipe.recipeId
      );

      await prisma.$queryRaw`COMMIT`;

    });//end transaction

    updatedRecipe = await RecipeManager.getRecipeById(newRecipe.recipeId);
    return updatedRecipe;

  } catch(error) {
    console.log("Error in transaction", error.message);
    await prisma.$queryRaw`ROLLBACK`;
    throw new Error("Database Transaction Error");
  }
};

  /** Adds a recipe to a user's cookbook.  Returns the cookbookEntry record.
   *
   * cookbookEntry is {cookbookEntryId, recipeId, username}
   *
   * Throws a BadRequestError if the connection is impossible.
   */
  static async addToCookbook(recipeId: number, username: string) {
  let checkForExisting = await prisma.cookbookEntry.count({
    where: {
      username,
      recipeId,
    }
  });
  if (checkForExisting !== 0) {
    throw new BadRequestError("Recipe already in cookbook");
  }

  try {
    const entry = await prisma.cookbookEntry.create({
      data: {
        username,
        recipeId
      }
    });
    return entry;
  } catch (err) {
    throw new BadRequestError(
      "Database transaction failed. Are recipeId and username correct?"
    );
  }
}

  /** Adds a recipe to a user's cookbook.
   * Returns {removed:{recipeId, username}} on success
   *
   * Throws a BadRequestError if cookbookEngry is missing for recipeId & username.
   */
  static async removeFromCookbook(recipeId: number, username: string) {

  let checkForExisting = await prisma.cookbookEntry.count({
    where: {
      username,
      recipeId,
    }
  });
  if (checkForExisting !== 1) {
    throw new BadRequestError("No cookbook entry to remove");
  }
  /**note: even though we use a deleteMany here, the where clause
   * should ensure that we only ever delete a single record    */

  await prisma.cookbookEntry.deleteMany({
    where: {
      username: username,
      recipeId: recipeId,
    }
  });

  return { removed: { recipeId, username } };

}

  /** Updates the list of steps for the recipe by adding, updating or deleting.
   *
   * Takes two lists of steps (current and revised).  Compares the lists
   * and processes each step by doing one of the following:
   *    Create: Creates a step that exists on the revised list but not the
   *            current list
   *    Delete: Deletes a step that exists on the current list but not on the
   *            revised list
   *    Update: Updates a step that exists on both step lists.
   *
   * @param: currentSteps -> List of existing steps.
   * @param: revisedSteps -> List of steps to end up in the database. (Each step
   *                         may or may not have a stepId.)
   * @param: recipeId -> The PK for the associated recipe.
   */

  static async _updateRecipeSteps(
  currentSteps: Step[],
  revisedSteps: (StepForUpdate | StepForCreate)[],
  recipeId: number,
) {

  const sortedSteps = StepManager.sortSteps(
    currentSteps,
    revisedSteps,
  );

  //delete
  for (const step of sortedSteps.toDelete) {
    await StepManager.deleteStepById(step.stepId);
  }

  //create
  for (const step of sortedSteps.toCreate) {
    await StepManager.createStep({
      recipeId: recipeId,
      stepNumber: step.stepNumber,
      instructions: step.instructions,
      ingredients: step.ingredients,
    });
  }

  //update
  for (const step of sortedSteps.toUpdate) {
    await StepManager.updateStep(step);
  }
}


  /** Fetches and deletes a single recipe record and its submodels from the
   * database by recipeId.  Returns the RecipeData of the deleted record.
   *
   * @param: id : number --> The recipeId to query
   * @returns: RecipeData (Promise)
   * {recipeId, name, description, sourceUrl, sourceName, steps}
   *
   * Throws an error if record is not found.
  */

  static async deleteRecipeById(id: number): Promise < RecipeData > {

  try { await this.deleteRecipeImage(id); }
    catch(err) {
    console.warn(`Image for recipeId ${id} could not be deleted`);
  }

    try {
    const recipe = await prisma.recipe.delete({
      where: {
        recipeId: id
      },
      include: {
        steps: {
          include: {
            ingredients: true,
          }
        }
      }
    });

    return recipe;
  } catch(err) {
    //use our custom error instead
    throw new NotFoundError("Recipe not found");
  }
};

  /**************************** IMAGES ***************************************/

  /**Uploads a file to s3 and stores the resulting uri in the imageUrl property
   *
   * @param file: the file to upload
   * @param id: the recipeId for the record to update
   *
   * @returns the updated recipe
   */
  static async updateRecipeImage(file: Express.Multer.File, id: number) {

  const basePath = `recipeImage/recipe-${id}`;
  await ImageHandler.uploadAllSizes(file.buffer, basePath);

  const recipe = await RecipeManager.getRecipeById(+id);


  recipe.imageSm = `https://sf-parsley.s3.amazonaws.com/${basePath}-sm`;
  recipe.imageMd = `https://sf-parsley.s3.amazonaws.com/${basePath}-md`;
  recipe.imageLg = `https://sf-parsley.s3.amazonaws.com/${basePath}-lg`;
  return await RecipeManager.updateRecipe(recipe);
}

  /**Deletes the image associated with the recipeId from s3 and updates the
   * imageUrl field.
   *
   * @param id: the recipeId for the record to update
   *
   * @returns {deleted:{imageUrl:string}}
   */
  static async deleteRecipeImage(id: number) {
  const path = `recipeImage/recipe-${id}`;
  await deleteFile(path);

  const recipe = await RecipeManager.getRecipeById(id);
  // const deleted = { imgUrl: recipe.imageUrl };

  recipe.imageSm = `${DEFAULT_IMG_URL}-sm`;
  recipe.imageMd = `${DEFAULT_IMG_URL}-md`;
  recipe.imageLg = `${DEFAULT_IMG_URL}-lg`;
  return await RecipeManager.updateRecipe(recipe);
  // return deleted;
}

}

export default RecipeManager;