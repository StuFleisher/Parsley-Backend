import prisma from '../prismaClient';
import { NotFoundError } from '../utils/expressError';
import IngredientManager from './ingredient';


/* Data and functionality for steps */


class StepManager {

  /** Creates a step in the database along with its associated ingredients
     * @param step
     *  {
      *  recipeId: Number -> PK for the recipe that the steps belongs to
      *  stepNumber: Number -> Index for the step in the recipe steps[]
      *  instructions:String -> instructions for the recipe
      *  ingredients: IIngredientBase[] -> list of ingredient objects that
      *  are associated with this step.
     * }
     *
     * @returns createdStep:IStep
     * { recipeId, stepId, stepNumber, instructions, ingredients }
     */

  static async createStep(step:StepForCreate) {

    const {recipeId, stepNumber, instructions, ingredients} = step;

    const createdStep = await prisma.step.create({
      data: {
        recipeId,
        stepNumber,
        instructions,
      }
    });

    // create ingredients for the new steps
    for (const ingredient of ingredients) {
      const { amount, description } = ingredient;
      await IngredientManager.createIngredient({
        amount: amount,
        description: description,
        instructionRef: ingredient.instructionRef,
        step: createdStep.stepId
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
    newStep: StepForUpdate,
  ) {
    const currentStep = await prisma.step.findUnique({
      where: { stepId: newStep.stepId },
      include: { ingredients: { orderBy: { ingredientId: 'asc' } } }
    });
    if (currentStep===null){throw new NotFoundError}

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
    // console.log("toDelete", toDelete)
    // console.log("toUpdate", toUpdate)
    // console.log("toCreate", toCreate)

    //delete omitted ingredients from this step
    for (const ingredient of toDelete) {
      await IngredientManager.deleteIngredient(
        ingredient.ingredientId
      );
    }

    //create added ingredients for this step
    for (const ingredient of toCreate) {
      await IngredientManager.createIngredient({
        amount: ingredient.amount,
        description: ingredient.description,
        instructionRef: ingredient.instructionRef,
        step: stepId,
      });
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

  static async deleteStepById(id: number): Promise<Step> {
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
    currentSteps: Step[],
    newSteps: (StepForUpdate | StepForCreate)[]
  ) {

    const stepsToCreate:StepForCreate[] = ( //exists in new but not current
      newSteps.filter((newStep): newStep is StepForCreate => {
        return (newStep as StepForUpdate).stepId === undefined;
      })
    );

    const stepsToUpdate:StepForUpdate[] = ( //exists in both lists
      newSteps.filter((newStep):newStep is StepForUpdate => {
        return currentSteps.some(
          (currentStep) => {
            return (newStep as StepForUpdate).stepId === currentStep.stepId;
          }
        );
      })
    );

    const stepsToDelete:Step[] = ( //exists in current but not new
      currentSteps.filter((currentStep):currentStep is Step => {
        return !newSteps.some(
          (newStep) => {
              return (newStep as Step).stepId === currentStep.stepId;
          }
        );
      })
    );

    return {
      toCreate: stepsToCreate,
      toUpdate: stepsToUpdate,
      toDelete: stepsToDelete,
    };
  }
}

export default StepManager;