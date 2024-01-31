"use strict";

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
require('../config'); //this loads the test database
const getPrismaClient = require('../client');
const prisma = getPrismaClient();

jest.mock('./ingredient', () => {
  return {
    createIngredient: jest.fn(),
    updateIngredient: jest.fn(),
    deleteIngredient: jest.fn(),
    sortIngredients: jest.fn(),
  };
});
const IngredientManager = require('./ingredient');

const StepManager = require('./step');
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  storedRecipe1,
} = require('../test/test_common');
const { NotFoundError } = require('../utils/expressError');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);

//*************************** CREATE ******************************************/
describe("Tests for createStep", function () {

  const stepToCreate: IStepBase = {
    recipeId: 1,
    stepNumber: 1,
    instructions: "testInstructions",
    ingredients: [],
  };

  const createdStep: IStep = {
    stepId: 1,
    recipeId: 1,
    stepNumber: 1,
    instructions: "testInstructions",
    ingredients: [],
  };

  //Works
  test("Creates Step", async function () {
    prisma.step.create.mockResolvedValueOnce(createdStep);
    prisma.step.findUniqueOrThrow.mockResolvedValueOnce(createdStep);

    const step = await StepManager.createStep(
      stepToCreate.recipeId,
      stepToCreate.stepNumber,
      stepToCreate.instructions,
    );

    expect(prisma.step.create).toHaveBeenCalledWith({
      data: {
        stepNumber: 1,
        instructions: "testInstructions",
        recipeId: 1,
      },
      orderBy: { stepNumber: 'asc' },
    });
    expect(step).toEqual({
      stepId: 1,
      recipeId: 1,
      stepNumber: 1,
      instructions: "testInstructions",
      ingredients: [],
    });

  });

  //Generates ingredients
  test("Creates Ingredients for the step", async function () {

    //test data
    const createdIngredient = {
      amount: "testAmount",
      description: "testDescription",
      stepId: 1,
      ingredientId: 1,
    };

    //mock dependencies
    prisma.step.create.mockResolvedValueOnce(createdStep);
    prisma.step.findUniqueOrThrow.mockResolvedValueOnce({
      ...createdStep,
      ingredients: [createdIngredient]
    });
    IngredientManager.createIngredient.mockResolvedValueOnce(createdIngredient);

    //run test
    const step = await StepManager.createStep(
      stepToCreate.recipeId,
      stepToCreate.stepNumber,
      stepToCreate.instructions,
      [{ amount: "testAmount", description: "testDescription" }],
    );

    expect(IngredientManager.createIngredient).toHaveBeenCalledWith(
      "testAmount",
      "testDescription",
      1,
    );
    expect(step.ingredients).toEqual([{
      amount: "testAmount",
      description: "testDescription",
      stepId: 1,
      ingredientId: 1,
    }]);
  });
});

//*************************** UPDATE ******************************************/

describe("Test updateStep", function () {
  //updates base data
  test("Updates base step data", async function () {
    //set up test data
    const initialStep = {
      ...storedRecipe1.steps[0],
      ingredients: [],
    };
    const updatedStep = {
      ...initialStep,
      stepNumber: 2,
      instructions: "newInstructions",
    };

    //mock dependencies
    prisma.step.findUnique.mockResolvedValueOnce(initialStep);
    prisma.step.update.mockResolvedValueOnce(updatedStep);
    IngredientManager.sortIngredients.mockReturnValueOnce({
      toCreate: [],
      toDelete: [],
      toUpdate: [],
    });
    prisma.step.findUniqueOrThrow.mockResolvedValueOnce(updatedStep);

    //do test
    const result = await StepManager.updateStep(updatedStep);

    expect(result).toEqual(updatedStep);
  });

  test("Deletes extra ingredients", async function () {
    //set up test data
    const initialStep = {
      ...storedRecipe1.steps[0],
    };
    const ingredientToDelete = initialStep.ingredients[0];
    const updatedStep = {
      ...initialStep,
      stepNumber: 2,
      instructions: "newInstructions",
      ingredients: [],
    };

    //mock dependencies
    prisma.step.findUnique.mockResolvedValueOnce(initialStep);
    prisma.step.update.mockResolvedValueOnce(updatedStep);
    IngredientManager.sortIngredients.mockReturnValueOnce({
      toCreate: [],
      toDelete: [ingredientToDelete],
      toUpdate: [],
    });
    prisma.step.findUniqueOrThrow.mockResolvedValueOnce(updatedStep);

    //do test
    const result = await StepManager.updateStep(updatedStep);
    expect(result).toEqual(updatedStep);

  });

  // deletes extra ingredients
  test("Creates new ingredients", async function () {
    //set up test data
    const ingredientToCreate = {
      amount: "testAmount",
      instructions: "testInstructions",
      step: 1,
    };
    const initialStep = {
      ...storedRecipe1.steps[0],
      ingredients: [],
    };
    const updatedStep = {
      ...storedRecipe1.steps[0],
      ingredients: [ingredientToCreate]
    };

    //mock dependencies
    prisma.step.findUnique.mockResolvedValueOnce(initialStep);
    prisma.step.update.mockResolvedValueOnce(updatedStep);
    IngredientManager.sortIngredients.mockReturnValueOnce({
      toCreate: [ingredientToCreate],
      toDelete: [],
      toUpdate: [],
    });
    prisma.step.findUniqueOrThrow.mockResolvedValueOnce(updatedStep);

    //do test
    const result = await StepManager.updateStep(updatedStep);
    expect(result).toEqual(updatedStep);

  });

  test("Updates existing ingredients", async function () {
    //set up test data
    const ingredientBeforeUpdate = storedRecipe1.steps[0].ingredients[0];
    const ingredientAfterUpdate = {
      amount: "testAmount",
      instructions: "testInstructions",
      step: 1,
    };
    const initialStep = {
      ...storedRecipe1.steps[0],
    };
    const updatedStep = {
      ...storedRecipe1.steps[0],
      ingredients: [ingredientAfterUpdate]
    };

    //mock dependencies
    prisma.step.findUnique.mockResolvedValueOnce(initialStep);
    prisma.step.update.mockResolvedValueOnce(updatedStep);
    IngredientManager.sortIngredients.mockReturnValueOnce({
      toCreate: [],
      toDelete: [],
      toUpdate: [ingredientAfterUpdate],
    });
    prisma.step.findUniqueOrThrow.mockResolvedValueOnce(updatedStep);

    //do test
    const result = await StepManager.updateStep(updatedStep);
    expect(result).toEqual(updatedStep);

  });

});

// //*************************** DELETE ******************************************/

describe("Tests for deleteStep", function () {

  const deletedStep: IStep = {
    stepId: 1,
    recipeId: 1,
    stepNumber: 1,
    instructions: "testInstructions",
    ingredients: [],
  };

  test("Deletes Step", async function () {
    prisma.step.delete.mockResolvedValueOnce(deletedStep);

    const step = await StepManager.deleteStepById(deletedStep.stepId);

    expect(prisma.step.delete).toHaveBeenCalledWith({
      where: {
        stepId: 1
      },
      include: {
        ingredients: true,
      }
    });

    expect(step).toEqual(deletedStep);

  });

  test("Throws an error for not found", async function () {
    prisma.step.delete.mockImplementationOnce(()=>{
      throw new Error();
    });

    try {
      await StepManager.deleteStepById(0);
      throw new Error("Fail test. You shouldn't get here");
    } catch (err) {
      console.log(err.message)
      expect(err instanceof NotFoundError).toBeTruthy();
    }

    expect(prisma.step.delete).toHaveBeenCalledWith({
      where: {
        stepId: 0
      },
      include: {
        ingredients: true,
      }
    })
  });


});

// //**************************SORT STEPS ******************************** */
describe("Tests for sortSteps", function () {
  //sorts toDelete correctly
  test("Sorts toDelete correctly", async function () {
    const currentSteps: IStep[] = [{
      recipeId: 1,
      stepNumber: 1,
      stepId: 1,
      ingredients: [],
      instructions: "testInstructions"
    }];
    const newSteps: IStepForUpdate[] = [];

    const result = StepManager.sortSteps(currentSteps, newSteps);

    expect(result).toEqual({
      toDelete: currentSteps,
      toUpdate: [],
      toCreate: [],
    });
  });

  //sorts toUpdate correctly
  test("Sorts toUpdate correctly", async function () {
    const currentSteps: IStep[] = [{
      recipeId: 1,
      stepNumber: 1,
      stepId: 1,
      ingredients: [],
      instructions: "testInstructions"
    }];
    const newSteps: IStepForUpdate[] = [{
      recipeId: 1,
      stepNumber: 1,
      stepId: 1,
      ingredients: [],
      instructions: "testInstructions"
    }];

    const result = StepManager.sortSteps(currentSteps, newSteps);

    expect(result).toEqual({
      toDelete: [],
      toUpdate: newSteps,
      toCreate: [],
    });
  });

  //sorts toCreate correctly
  test("Sorts toCreate correctly", async function () {
    const currentSteps: IStep[] = [];
    const newSteps: IStepForUpdate[] = [{
      recipeId: 1,
      stepNumber: 1,
      ingredients: [],
      instructions: "testInstructions"
    }];

    const result = StepManager.sortSteps(currentSteps, newSteps);
    expect(result).toEqual({
      toDelete: [],
      toUpdate: [],
      toCreate: newSteps,
    });
  });
});
