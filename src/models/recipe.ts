"use strict";

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };
import { Prisma, PrismaClient } from '@prisma/client';

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */

const { DATABASE_URL } = require('../config');

const getPrismaClient = require('../client');
const prisma = getPrismaClient();
const { NotFoundError } = require('../utils/expressError');
const StepManager = require('./step')

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

  static async saveRecipe(clientRecipe: IRecipeBase): Promise<RecipeData> {
    let recipe = RecipeManager._pojoToPrismaRecipeInput(clientRecipe);
    return await prisma.recipe.create({
      data: recipe,
      include: {
        steps: {
          include: {
            ingredients: true,
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
          },
        });

        const temp = await RecipeManager._updateRecipeSteps(
          currentRecipe.steps,
          newRecipe.steps,
          newRecipe.recipeId
        )

        await prisma.$queryRaw`COMMIT`;

        updatedRecipe = await RecipeManager.getRecipeById(newRecipe.recipeId)

      });//end transaction
    } catch (error) {
      console.log("Error in transaction", error.message);
      await prisma.$queryRaw`ROLLBACK`;
      throw new Error("Database Transaction Error");
    }

    return updatedRecipe;
  }

  /** Takes two lists of steps (current and revised).  Compares the lists
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
    currentSteps:IStep[],
    revisedSteps:IStepForUpdate[],
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
      await StepManager.createStep(step, recipeId);
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

   /** Accepts an IRecipeWithMetadata object and reshapes it to be appropriate
   * for use in Prisma create commands.  (Submodels will be wrapped in a
   * 'create' property)
   */

  static _pojoToPrismaRecipeInput(recipe: IRecipeBase): Prisma.RecipeCreateInput {
    const { steps, ...metadata } = recipe;
    return {
      ...metadata,
      steps: {
        create: steps.map(step => {
          return {
            stepNumber: step.stepNumber,
            instructions: step.instructions,
            ingredients: {
              create: step.ingredients.map(ingredient => {
                return {
                  amount: ingredient.amount,
                  description: ingredient.description
                };
              })
            }
          };
        })
      }
    };
  }

}

module.exports = RecipeManager;