import '../config'; //this loads the test database
import {prismaMock as prisma} from '../prismaSingleton';
import { jest } from '@jest/globals';

jest.mock('./ingredient', () => {
  return {
    createIngredient: jest.fn(),
    updateIngredient: jest.fn(),
    deleteIngredient: jest.fn(),
    sortIngredients: jest.fn(),
  };
});
import IngredientManager from './ingredient';
const mockedIngredientManager = (
  IngredientManager as jest.Mocked<typeof IngredientManager>
);

import StepManager from './step';
import {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  storedRecipe1,
} from '../test/test_common';
import { NotFoundError } from '../utils/expressError';


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

  const createdStep: Step = {
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

    const step = await StepManager.createStep(stepToCreate);

    expect(prisma.step.create).toHaveBeenCalledWith({
      data: {
        stepNumber: 1,
        instructions: "testInstructions",
        recipeId: 1,
      },
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
    const createdIngredient:IIngredient = {
      amount: "testAmount",
      description: "testDescription",
      instructionRef:"testInstructionRef",
      ingredientId: 1,
      step:1,
    };

    //mock dependencies
    prisma.step.create.mockResolvedValueOnce(createdStep);
    mockedIngredientManager
      .createIngredient
      .mockResolvedValueOnce(createdIngredient);
    prisma.step.findUniqueOrThrow.mockResolvedValueOnce({
      ...createdStep,
      ingredients: [createdIngredient] as any
    });

    //run test
    const step = await StepManager.createStep({
      ...stepToCreate,
      ingredients:[{
        amount:"testAmount",
        description:"testDescription",
        instructionRef:"testInstructionRef",
      }]
    });

    expect(IngredientManager.createIngredient).toHaveBeenCalledTimes(1);
    expect(IngredientManager.createIngredient).toHaveBeenCalledWith({
      amount: "testAmount",
      description: "testDescription",
      instructionRef: "testInstructionRef",
      step:1,
    });
    expect(step.ingredients).toEqual([{
      amount: "testAmount",
      description: "testDescription",
      instructionRef: "testInstructionRef",
      step: 1,
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
    mockedIngredientManager.sortIngredients.mockReturnValueOnce({
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
    mockedIngredientManager.sortIngredients.mockReturnValueOnce({
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
      description: "testInstructions",
      instructionRef: "testInstructionRef",
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
    mockedIngredientManager.sortIngredients.mockReturnValueOnce({
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
      description: "testInstructions",
      instructionRef: "testInstructionRef",
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
    mockedIngredientManager.sortIngredients.mockReturnValueOnce({
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

  const deletedStep: Step = {
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
    const currentSteps: Step[] = [{
      recipeId: 1,
      stepNumber: 1,
      stepId: 1,
      ingredients: [],
      instructions: "testInstructions"
    }];
    const newSteps: StepForUpdate[] = [];

    const result = StepManager.sortSteps(currentSteps, newSteps);

    expect(result).toEqual({
      toDelete: currentSteps,
      toUpdate: [],
      toCreate: [],
    });
  });

  //sorts toUpdate correctly
  test("Sorts toUpdate correctly", async function () {
    const currentSteps: Step[] = [{
      recipeId: 1,
      stepNumber: 1,
      stepId: 1,
      ingredients: [],
      instructions: "testInstructions"
    }];
    const newSteps: StepForUpdate[] = [{
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
    console.log("sorts toCreate")
    const currentSteps: Step[] = [];
    const newSteps: StepForCreate[] = [{
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
