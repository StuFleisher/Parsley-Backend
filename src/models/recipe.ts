"use strict";

// import { Prisma } from '@prisma/client';
// import prisma from "../client.js";
// import { DATABASE_URL } from '../config.js';
// import { NotFoundError } from '../utils/expressError.js';

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };
import { Prisma, PrismaClient } from '@prisma/client';
import { create } from 'domain';

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const prisma = require('../client');
const { DATABASE_URL } = require('../config');
const { NotFoundError } = require('../utils/expressError');


/** Data and functionality for recipes */

class RecipeFactory {

  /** Create a recipe from data, store it to the database, then return data
   * from the new record
   *
   * @param: clientRecipe - The recipe data including all metadata and submodels
   * but not including system generated data (like id).
   * @returns: RecipeData (Promise) - Full recipe data including system generated
   * fields
   *  */

  static async saveRecipe(clientRecipe: IRecipeBase): Promise<RecipeData> {
    let recipe = RecipeFactory._pojoToPrismaRecipeInput(clientRecipe);
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
    const currentRecipe: RecipeData = await prisma.recipe.findUniqueOrThrow({
      where: { recipeId: newRecipe.recipeId },
      include: {
        steps: { include: { ingredients: true, } }
      }
    });

    try {
      await prisma.$transaction(async (prisma: PrismaClient) => {

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

        const sortedSteps = this.sortSteps(
          currentRecipe.steps,
          newRecipe.steps
        );
        // console.log("sortedSteps:",sortedSteps)

        //delete
        for (const step of sortedSteps.toDelete) {
          await prisma.step.delete({
            where: { stepId: step.stepId }
          });
        }

        //create
        for (const step of sortedSteps.toCreate) {
          await this.createStep(prisma, step, currentRecipe.recipeId);
        }

        //update
        for (const step of sortedSteps.toUpdate) {
          await this.updateStep(prisma, step);
        }

        await prisma.$queryRaw`COMMIT`;

        updatedRecipe = await prisma.recipe.findUnique({
          where: { recipeId: newRecipe.recipeId },
          include: {
            steps: {
              include: { ingredients: { orderBy: { ingredientId: 'asc' } } },
              orderBy: { stepNumber: 'asc' },
            },
          },
        });
      });//end transaction func
    } catch (error) {
      console.log("Error in transaction", error.message);
      await prisma.$queryRaw`ROLLBACK`;
      throw error;
    }

    return updatedRecipe;
  }


  /** Compares new and existing ingredient data and returns a sorted object:
   * toCreate -> exists in new but not current
   * toUpdate -> exists in both lists
   * toDelete -> exists in current but not new
   *
   * @param currentIngredients
   * @param newIngredients
   * @returns {toCreate, toUpdate, toDelete}
   */

  static sortIngredients(
    currentIngredients: IIngredient[],
    newIngredients: IIngredientForUpdate[],
  ) {
    const ingredientsToDelete = currentIngredients.filter(currentIngredient => {
      return !newIngredients.some(
        (newIngredient) => {
          return currentIngredient.ingredientId === newIngredient.ingredientId;
        }
      );
    });

    const ingredientsToCreate = newIngredients.filter(newIngredient => {
      return newIngredient.ingredientId === undefined;
    });

    const ingredientsToUpdate = newIngredients.filter(
      newIngredient => {
        return currentIngredients.some(currentIngredient => {
          return currentIngredient.ingredientId === newIngredient.ingredientId;
        });
      }
    );

    return {
      toCreate: ingredientsToCreate,
      toUpdate: ingredientsToUpdate,
      toDelete: ingredientsToDelete,
    };
  }


  /** Compares new and existing step data and returns a sorted object:
   * toCreate -> exists in new but not current
   * toUpdate -> exists in both lists
   * toDelete -> exists in current but not new
   *
   * @param prisma
   * @param currentIngredients
   * @param newIngredients
   * @returns {toCreate, toUpdate, toDelete}
   */

  static sortSteps(
    currentSteps: IStep[],
    newSteps: IStepForUpdate[]
  ) {
    const stepsToCreate = newSteps.filter((newStep) => {
      return newStep.stepId === undefined;
    });

    const stepsToUpdate = newSteps.filter((newStep) => {
      return currentSteps.some(
        (currentStep) => { return newStep.stepId === currentStep.stepId; }
      );
    });

    const stepsToDelete = currentSteps.filter((currentStep) => {
      return !newSteps.some(
        (newStep) => { return newStep.stepId === currentStep.stepId; }
      );
    });

    return {
      toCreate: stepsToCreate,
      toUpdate: stepsToUpdate,
      toDelete: stepsToDelete,
    };
  }


  /** Creates Step records in the database belonging to a specific recipe
   * @param prisma a PrismaClient instance
   * @param stepsToCreate a list of the steps to create
   * @param recipeId PK for the recipe that the steps belongs to
   *
   * @returns createdStep:IStep
   * { recipeId, stepId, stepNumber, instructions, ingredients }
   */

  static async createStep(
    prisma: PrismaClient,
    step: IStepForUpdate,
    recipeId: number
  ) {
    const { stepNumber, instructions } = step;
    const createdStep = await prisma.step.create({
      data: { stepNumber, instructions, recipeId }
    });

    //create ingredients for the new steps
    for (const ingredient of step.ingredients) {
      const { amount, description } = ingredient;
      await prisma.ingredient.create({
        data: { amount, description, step: createdStep.stepId }
      });
    }

    return prisma.step.findUniqueOrThrow({
      where: { stepId: createdStep.stepId },
      include: { ingredients: { orderBy: { ingredientId: 'asc' } } },
    });
  }

  /**Updates an existing Step record in the database to match the passed step
   *
   * @param prisma: PrismaClient instance
   * @param newStep: Step with updated values
   */

  static async updateStep(
    prisma: PrismaClient,
    newStep: IStepForUpdate,
  ) {
    const currentStep = await prisma.step.findUnique({
      where: { stepId: newStep.stepId },
      include: { ingredients: { orderBy: { ingredientId: 'asc' } } }
    });

    const { stepNumber, stepId, instructions } = newStep;

    //update base step data
    await prisma.step.update({
      where: { stepId: stepId },
      data: { stepNumber, instructions },
    });

    const { toCreate, toDelete, toUpdate } = this.sortIngredients(
      currentStep.ingredients,
      newStep.ingredients
    );

    //delete omitted ingredients from this step
    for (const ingredient of toDelete) {
      await prisma.ingredient.delete({
        where: { ingredientId: ingredient.ingredientId }
      });
    }

    //create added ingredients for this step
    await prisma.ingredient.createMany({
      data: toCreate.map(ingred => {
        return {
          amount: ingred.amount,
          description: ingred.description,
          step: currentStep.stepId,
        };
      })
    });

    //update existing ingredients for this step
    for (const ingredient of toUpdate) {
      await prisma.ingredient.update({
        where: { ingredientId: ingredient.ingredientId },
        data: {
          ...ingredient,
          step: currentStep.stepId,
        }
      });
    }

    return prisma.step.findUniqueOrThrow({
      where: { stepId: newStep.stepId },
      include: { ingredients: { orderBy: { ingredientId: 'asc' } } },
    });

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

module.exports = RecipeFactory;