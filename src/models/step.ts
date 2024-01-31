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
const IngredientManager = require('./ingredient');

/* Data and functionality for steps */


class StepManager {

  /** Creates a step in the database along with its associated ingredients
     * @param recipeId: Number -> PK for the recipe that the steps belongs to
     * @param stepNumber: Number -> Index for the step in the recipe steps[]
     * @param instructions:String -> instructions for the recipe
     * @param ingredients: IIngredientBase[] -> list of ingredient objects that
     *  are associated with this step.
     *
     * @returns createdStep:IStep
     * { recipeId, stepId, stepNumber, instructions, ingredients }
     */

  static async createStep(
    // step: IStepForUpdate,
    recipeId: number,
    stepNumber: number,
    instructions: string,
    ingredients: IIngredientBase[] = [],
  ) {
    const createdStep = await prisma.step.create({
      data: {
        recipeId,
        stepNumber,
        instructions,
      },
      orderBy: {stepNumber:'asc'}
    });

    // create ingredients for the new steps
    for (const ingredient of ingredients) {
      const { amount, description } = ingredient;
      await IngredientManager.createIngredient(
        amount,
        description,
        createdStep.stepId);
    }

    return prisma.step.findUniqueOrThrow({
      where: { stepId: createdStep.stepId },
      include: { ingredients: { orderBy: { ingredientId: 'asc' } } },
      orderBy: {stepNumber:'asc'},
    });
  }


  /**Updates an existing Step record in the database to match the passed step
   *
   * @param prisma: PrismaClient instance
   * @param newStep: Step with updated values
   */

  static async updateStep(
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

    const { toCreate, toDelete, toUpdate } = IngredientManager.sortIngredients(
      currentStep.ingredients,
      newStep.ingredients
    );
    console.log("toDelete", toDelete)
    console.log("toUpdate", toUpdate)
    console.log("toCreate", toCreate)

    //delete omitted ingredients from this step
    for (const ingredient of toDelete) {
      await IngredientManager.deleteIngredient(
        ingredient.ingredientId
      );
    }

    //create added ingredients for this step
    for (const ingredient of toCreate) {
      await IngredientManager.createIngredient(
        ingredient.amount,
        ingredient.description,
        stepId,
      );
    }

    //update existing ingredients for this step
    for (const ingredient of toUpdate) {
      await IngredientManager.updateIngredient(
        ingredient,
        stepId,
      );
    }

    const updatedStep = await prisma.step.findUniqueOrThrow({
      where: { stepId: newStep.stepId },
      include: { ingredients: { orderBy: { ingredientId: 'asc' } } },
    });

    return updatedStep;
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

  static async deleteStepById(id: number): Promise<IStep> {
    try {
      const step = await prisma.step.delete({
        where: {
          stepId: id
        },
        include: {
          ingredients: true,
        }
      });

      return step;
    } catch (err) {
      //use our custom error instead
      throw new NotFoundError("step not found");
    }
  };


  /** Compares new and existing step data and returns a sorted object:
   * toCreate -> exists in new but not current
   * toUpdate -> exists in both lists
   * toDelete -> exists in current but not new
   *
   * @param prisma
   * @param currentSteps
   * @param newSteps
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
}

module.exports = StepManager;