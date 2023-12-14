"use strict";

// import { Prisma } from '@prisma/client';
// import prisma from "../client.js";
// import { DATABASE_URL } from '../config.js';
// import { NotFoundError } from '../utils/expressError.js';

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };
import { Prisma, PrismaClient } from '@prisma/client';

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


  /** Fetches and returns a single recipe record and its submodels from the database
   *  by recipeId.
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

    let updatedRecipe: RecipeData;
    const currentRecipe: RecipeData = await prisma.recipe.findUniqueOrThrow({
      where: { recipeId: newRecipe.recipeId },
      include: {
        steps: { include: { ingredients: true, } }
      }
    });
    
    const ingredientsFromCurrentRecipe = currentRecipe.steps.flatMap(currentStep => {
      return currentStep.ingredients;
    });
    const ingredientsFromNewRecipe = newRecipe.steps.flatMap(newStep => {
      return newStep.ingredients;
    });

    try {

      await prisma.$transaction(async (prisma: PrismaClient) => {

        //Sort steps from both recipes by category: Create, Update, or Delete
        const stepsToCreate = newRecipe.steps.filter((newStep) => {
          return newStep.stepId === undefined;
        });

        const stepsToUpdate = newRecipe.steps.filter((newStep) => {
          return currentRecipe.steps.some(
            (currentStep) => { return newStep.stepId === currentStep.stepId; }
          );
        });

        const stepsToDelete = currentRecipe.steps.filter((currentStep) => {
          return !newRecipe.steps.some(
            (newStep) => { newStep.stepId === currentStep.stepId; }
          );
        });

        //Sort ingredients from both recipes by category:Create, Update, or Delete
        const ingredientsToCreate = ingredientsFromNewRecipe.filter(newIngredient => {
          return newIngredient.ingredientId === undefined;
        });

        const ingredientsToUpdate = ingredientsFromNewRecipe.filter(
          newIngredient => {
            ingredientsFromCurrentRecipe.some(currentIngredient => {
              return currentIngredient.ingredientId === newIngredient.ingredientId;
            });
          }
        );

        const ingredientsToDelete = ingredientsFromCurrentRecipe.filter(currentIngredient => {
          return !ingredientsFromNewRecipe.some(
            (newIngredient) => { currentIngredient.ingredientId === newIngredient.ingredientId; }
          );
        });


        //CREATE STEPS
        for (const step of stepsToCreate) {
          const { stepNumber, instructions } = step;
          const createdStep = await prisma.step.create({
            data: { stepNumber, instructions, recipeId: currentRecipe.recipeId }
          });

          //create ingredients for the new steps
          for (const ingredient of step.ingredients) {
            const { amount, description } = ingredient;
            await prisma.ingredient.create({
              data: { amount, description, step: step.stepId }
            });
          }
        }

        //UPDATE STEPS
        for (const step of stepsToUpdate) {
          const { stepNumber, stepId, instructions } = step;

          //Create new ingredients
          const toCreate = step.ingredients.filter(stepIngred => {
            return ingredientsToCreate.some(ingred => {
              return ingred.ingredientId === stepIngred.ingredientId;
            });
          });
          await prisma.ingredient.createMany({
            data: toCreate.map(ingred => {
              return {
                amount: ingred.amount,
                description: ingred.description,
                step: step.stepId,
              };
            })
          });

          //Update existing ingredients
          const toUpdate = step.ingredients.filter(stepIngred => {
            return ingredientsToUpdate.some(ingred => {
              return ingred.ingredientId === stepIngred.ingredientId;
            });
          });
          for (const ingredient of toUpdate) {
            await prisma.ingredient.update({
              where: { ingredientId: ingredient.ingredientId },
              data: {
                ...ingredient,
                step: step.stepId,
              }
            });
          }

          //Delete extra ingredients
          const toDelete = step.ingredients.filter(stepIngred => {
            return ingredientsToDelete.some(ingred => {
              return ingred.ingredientId === stepIngred.ingredientId;
            });
          });
          for (const ingredient of toDelete) {
            await prisma.ingredient.delete({
              where: { ingredientId: ingredient.ingredientId },
            });
          }

          //update step data
          await prisma.step.update({
            where: { stepId: stepId },
            data: { stepNumber, instructions },
          });

        }

        //DELETE STEPS
        for (const step of stepsToDelete) {
          const { stepNumber, instructions } = step;
          const createdStep = await prisma.step.delete({
            where: { stepId: step.stepId }
          });
        }

        //Update recipe data
        await prisma.recipe.update({
          where: { recipeId: currentRecipe.recipeId },
          data: {
            name: newRecipe.name,
            description: newRecipe.description,
            sourceName: newRecipe.sourceName,
            sourceUrl: newRecipe.sourceUrl,
          },
          include: { steps: { include: { ingredients: true } } },
        });

        await prisma.$queryRaw`COMMIT`;

        updatedRecipe = await prisma.recipe.findUnique({
          where: { recipeId: newRecipe.recipeId },
          include: {
            steps: { include: { ingredients: true } },
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


  /** Fetches and deletes a single recipe record and its submodels from the database
   *  by recipeId.  Returns the RecipeData of the deleted record.
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