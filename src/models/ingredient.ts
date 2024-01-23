/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };
// import { Prisma, PrismaClient } from '@prisma/client';TODO:  Is this doing anything?

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const getPrismaClient = require('../client');
const { DATABASE_URL } = require('../config');
const { NotFoundError } = require('../utils/expressError');

const prisma = getPrismaClient();

/** Data and functionality for ingredients */

class IngredientManager {

  /**Creates an ingredient from properties and stores it in the database
   *
   * @param amount string -> representation of the ingredient quantity needed
   * @param description string -> description of the ingredient
   * @param instructionRef string -> text used in step instruction to refer to
   *  this ingredient.
   * @param stepId number -> PK for the step this ingredient belongs to
   *
   * @returns ingredient {ingredientId, step, amount,instructionRef, description}
   */

  static async createIngredient(
    amount: string,
    description: string,
    instructionRef: string,
    stepId: number
  ): Promise<IIngredient|void> {

    console.log("running this.createIngredient")
    const ingredient = await prisma.ingredient.create({
      data: {
        amount: amount,
        description: description,
        instructionRef: instructionRef,
        step: stepId,
      }
    });
    return ingredient;
  }


  /**Updates an ingredient and stores it in the database
   *
   * @param ingredient: {ingredientId, step, amount, instructionRef, description}
   * @param stepId: number
   *
   * @returns updatedIngredient {ingredientId, step, amount, description}
   */

  static async updateIngredient(
    ingredient: IIngredient,
    stepId: number
  ): Promise<IIngredient> {
    const updatedIngredient = await prisma.ingredient.update({
      where: { ingredientId: ingredient.ingredientId },
      data: {
        ...ingredient,
        step: stepId,
      }
    });
    return updatedIngredient;
  }


  /** Deletes an ingredient by ingredientId
   *
   * @param ingredientId
   * @returns deletedIngredient {ingredientId, step, amount, instructionRef, description}
   */
  static async deleteIngredient(ingredientId: number): Promise<IIngredient> {
    try{
      const deletedIngredient = await prisma.ingredient.delete({
        where: { ingredientId: ingredientId }
      });
      return deletedIngredient;
    } catch {
      throw new NotFoundError("Ingredient not found")
    }
  }


  /** Compares new and existing ingredient data and returns a sorted object:
   *     toCreate -> exists in new but not current
   *     toUpdate -> exists in both lists
   *     toDelete -> exists in current but not new
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

}

module.exports = IngredientManager;