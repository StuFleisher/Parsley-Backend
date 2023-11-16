"use strict"

import { Prisma } from '@prisma/client';
import prisma from "../client";
import { DATABASE_URL } from '../config';

console.log("DB from recipes.ts", DATABASE_URL);

/** Data and functionality for recipes */

class Recipe {



  /** Create a recipe from data, store it to the database, then return data
   * from the new record
   *
   *  */

  static async saveRecipe(clientRecipe:IRecipeBase) {
    let recipe = Recipe._pojoToPrismaRecipeInput(clientRecipe);
    return await prisma.recipe.create({
      data:recipe,
      include:{
        steps:{
          include:{
            ingredients:true,
          }
        }
      }
    });
  }

  /** Returns a list of all recipes. Does not include recipe steps or
   * ingredients*/

  static async getAllRecipes(){
    let recipes = await prisma.recipe.findMany({});
    return recipes;
  }

  //Get All

  //Get One

  //Update

  //Delete

  /** Accepts an IRecipeWithMetadata object and reshapes it to be appropriate
   * for use in Prisma create commands.  (Submodels will be wrapped in a
   * 'create' property)
   */
  static _pojoToPrismaRecipeInput(recipe:IRecipeBase):Prisma.RecipeCreateInput{
    const {steps, ...metadata} = recipe;
    return {
      ...metadata,
      steps:{
        create:steps.map(step=>{
          return {
            stepNumber:step.stepNumber,
            instructions: step.instructions,
            ingredients:{
              create:step.ingredients.map(ingredient=>{
                return {
                  amount:ingredient.amount,
                  description:ingredient.description
                }
              })
            }
          }
        })
      }
    }
  }

}

export default Recipe;