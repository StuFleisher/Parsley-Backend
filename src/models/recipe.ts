"use strict"

import { BadRequestError, NotFoundError } from "../utils/expressError";

/** Data and functionality for recipes */

class Recipe {



  /** Create a recipe from data, store it to the database, then return data
   * from the new record
   *
   *
   * Returns an IRecipe or an throws an error.
   *  */

  static async saveRecipe(recipe:IRecipeWithMetadata):Promise<IRecipe> {

    //create recipe
    const result = await db.query(`
      INSERT INTO recipes

    `)

    //create steps
    //create ingredients

  }

  //Get All

  //Get One

  //Update

  //Delete
}

