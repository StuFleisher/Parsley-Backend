
import '../config';
import { Prisma } from '@prisma/client';
import prisma from '../prismaClient';
import { NotFoundError } from '../utils/expressError';
import StepManager from './step';
import { uploadFile, deleteFile } from "../api/s3";
import IngredientManager from './ingredient';

const DEFAULT_IMG_URL = "https://sf-parsley.s3.amazonaws.com/recipeImage/parsley.jpg"


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
      imageUrl,
      owner,
      steps
    } = clientRecipe;

    const createdRecipe = await prisma.recipe.create({
      data: {
        name,
        description,
        sourceUrl,
        sourceName,
        imageUrl,
        owner,
      }
    })

    for (const step of steps){
      await StepManager.createStep({
        recipeId:createdRecipe.recipeId,
        stepNumber: step.stepNumber,
        ingredients: step.ingredients,
        instructions: step.instructions,
      });
    }

    return await prisma.recipe.findUniqueOrThrow({
      where: {recipeId:createdRecipe.recipeId},
      include:{
        steps:{
          orderBy:{stepNumber:'asc'},
          include:{
            ingredients:{
              orderBy:{ingredientId:'asc'},
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

  static async getAllRecipes(): Promise<SimpleRecipeData[]> {
    let recipes: SimpleRecipeData[] = await prisma.recipe.findMany({});
    return recipes;
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

  static async getRecipeById(id: number): Promise<RecipeData> {
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
    } catch (err) {
      console.log("catching error")
      //use our custom error instead
      throw new NotFoundError("Recipe not found");
    }

  }


  /**Fetches and updates a single recipe record and its submodel data
   * Returns the updated RecipeData
   *
   * @param: id : number
   * @returns: RecipeData (Promise)
   * {recipeId, name, description, sourceUrl, sourceName, steps}
   *
   * Throws an error if record is not found.
   */

  static async updateRecipe(newRecipe: IRecipeForUpdate): Promise<RecipeData> {

    //TODO: handle id from url param, not request body
    //TODO: prevent manual changes to stepId & ingredientId
    let updatedRecipe: RecipeData;
    const currentRecipe: RecipeData = (
      await RecipeManager.getRecipeById(newRecipe.recipeId)
    )

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
            imageUrl: newRecipe.imageUrl
          },
        });

        const temp = await RecipeManager._updateRecipeSteps(
          currentRecipe.steps,
          newRecipe.steps,
          newRecipe.recipeId
        )

        await prisma.$queryRaw`COMMIT`;

      });//end transaction

      updatedRecipe = await RecipeManager.getRecipeById(newRecipe.recipeId)
      return updatedRecipe;

    } catch (error) {
      console.log("Error in transaction", error.message);
      await prisma.$queryRaw`ROLLBACK`;
      throw new Error("Database Transaction Error");
    }
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
    currentSteps:Step[],
    revisedSteps:(StepForUpdate|StepForCreate)[],
    recipeId:number,
  ){

    const sortedSteps = StepManager.sortSteps(
      currentSteps,
      revisedSteps,
    );

    //delete
    for (const step of sortedSteps.toDelete) {
      await StepManager.deleteStepById(step.stepId)
    }

    //create
    for (const step of sortedSteps.toCreate) {
      await StepManager.createStep({
        recipeId:recipeId,
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

  static async deleteRecipeById(id: number): Promise<RecipeData> {

    try {await this.deleteRecipeImage(id);}
    catch(err){
      console.warn(`Image for recipeId ${id} could not be deleted`)
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
    } catch (err) {
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
  static async updateRecipeImage(file:Express.Multer.File, id:number){
    const path= `recipeImage/recipe-${id}`
    const s3Response = await uploadFile(file,path);

    const recipe = await RecipeManager.getRecipeById(+id);
    recipe.imageUrl = `https://sf-parsley.s3.amazonaws.com/${path}`
    console.log("recipe in route", recipe.imageUrl)
    return await RecipeManager.updateRecipe(recipe)
  }

  /**Deletes the image associated with the recipeId from s3 and updates the
   * imageUrl field.
   *
   * @param id: the recipeId for the record to update
   *
   * @returns {deleted:{imageUrl:string}}
   */
  static async deleteRecipeImage(id:number){
    const path= `recipeImage/recipe-${id}`
    const s3Response = await deleteFile(path);
    console.log("s3Response",s3Response);

    const recipe = await RecipeManager.getRecipeById(id);
    const deleted = {imgUrl:recipe.imageUrl};
    console.log(deleted)
    recipe.imageUrl = DEFAULT_IMG_URL
    await RecipeManager.updateRecipe(recipe)
    return deleted;
  }

}

 export default RecipeManager;