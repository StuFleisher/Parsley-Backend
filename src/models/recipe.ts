"use strict";

import { Prisma } from '@prisma/client';
import prisma from "../client";
import { DATABASE_URL } from '../config';

console.log("DB from recipes.ts", DATABASE_URL);

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


  //Get One

  //Update

  //Delete

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

export default RecipeFactory;