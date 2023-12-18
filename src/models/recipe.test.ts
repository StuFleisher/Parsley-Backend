"use strict";

import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { describe } from "node:test";

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
require('../config'); //this loads the test database
const getPrismaClient = require('../client');
const prisma = getPrismaClient();
const RecipeManager = require('./recipe');
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  userSubmittedRecipe1,
  userSubmittedRecipe2,
  storedRecipe1,
} = require('../test/test_common');
const { NotFoundError } = require('../utils/expressError');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);

/********************** CREATE *******************************/
describe("Test Create Recipe", function () {

  test("Returns created model with submodels", async function () {
    prisma.recipe.create.mockReturnValueOnce(storedRecipe1)

    const recipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    expect(prisma.recipe.create).toHaveBeenCalledTimes(1);
    expect(recipe.steps[0]).toEqual({
        recipeId:1,
        stepId:1,
        stepNumber: 1,
        instructions: "R1S1Instructions",
        ingredients: [{
          ingredientId:1,
          step:1,
          amount: "R1S1I1Amount",
          description: "R1S1I1Description"
        }]
      })
  });
});


/**************** GET ALL **************************/
describe("Test getAllRecipes", function () {

  const queryResult = [
    {
      recipeId:1,
      name: "R1Name",
      description: "R1Description",
      sourceUrl: "http://R1SourceUrl.com",
      sourceName: "R1SourceName",
    },
    {
      recipeId:2,
      name: "R2Name",
      description: "R2Description",
      sourceUrl: "http://R2SourceUrl.com",
      sourceName: "R2SourceName",
    },
  ]

  test("Returns multiple recipes", async function () {
    prisma.recipe.findMany.mockReturnValueOnce(queryResult)

    const recipes = await RecipeManager.getAllRecipes();
    expect(recipes.length).toEqual(2);
    expect(recipes).toEqual(queryResult)
  });

  test("Does not return submodel data", async function () {
    prisma.recipe.findMany.mockReturnValueOnce(queryResult)

    const recipes = await RecipeManager.getAllRecipes();
    expect(recipes[0]).not.toHaveProperty("steps");
  });
});

// /**************** GET BY ID **************************/
describe("Test getRecipeById", function () {

  test("Returns the correct record with submodels", async function () {
    prisma.recipe.findUniqueOrThrow.mockReturnValueOnce(storedRecipe1)

    const result = await RecipeManager.getRecipeById(1);

    expect(result).toEqual(storedRecipe1);
  });

  test("Throws a NotFound error if record doesn't exist", async function () {
    prisma.recipe.findUniqueOrThrow.mockImplementationOnce(()=>{
      throw new Error();
    })

    const recipe1 = await RecipeManager.saveRecipe(userSubmittedRecipe1);

    try {
      await RecipeManager.getRecipeById(0);
      throw new Error("Fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

});


// /**************** UPDATE **************************/
describe("Test updateRecipe", function () {

  const updatedRecipe = {
    recipeId:1,
    name: "UpdatedName",
    description: "UpdatedDescription",
    sourceUrl: "http://updatedSourceUrl.com",
    sourceName: "updatedSourceName",
  }

  const updatedStep = {
    recipeId:1,
    stepId:1,
    stepNumber: 1,
    instructions: "UpdatedInstructions",
  }

  const updatedIngredient = {
    ingredientId:1,
    step:1,
    amount: "R1S1I1Amount",
    description: "R1S1I1Description"
  }

  //Updates base recipe data
  test("Updates base recipe data", async function () {
    // TODO: rewrite testing starting here

    const currentRecipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const newRecipe = {
      ...currentRecipe,
      name: 'newName',
      description: 'newDescription',
      sourceName: 'newSourceName',
      sourceUrl: 'newSourceUrl'
    };

    const result = await RecipeManager.updateRecipe(newRecipe);

    expect(result.name).toEqual("newName");
    expect(result.description).toEqual("newDescription");
    expect(result.sourceName).toEqual("newSourceName");
    expect(result.sourceUrl).toEqual("newSourceUrl");
  });

  //Adds new ingredient to existing step
  test("Adds new ingredient to existing step", async function () {
    const currentRecipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const newRecipe = {
      ...currentRecipe,
    };
    newRecipe.steps[0].ingredients.push({
      step: currentRecipe.steps[0].stepId,
      amount: "newAmount",
      description: "newDescription",
    });

    const result = await RecipeManager.updateRecipe(newRecipe);

    //note: This test depends on the orderBy for ingredients
    expect(result.steps[0].ingredients.length).toEqual(2);
    expect(result.steps[0].ingredients[1].ingredientId).toBeDefined();
    expect(result.steps[0].ingredients[1].step).toEqual(
      currentRecipe.steps[0].ingredients[0].step
    );
    expect(result.steps[0].ingredients[1].amount).toEqual(
      "newAmount"
    );
    expect(result.steps[0].ingredients[1].description).toEqual(
      "newDescription"
    );
  });

  //Updates existing ingredient on existing step
  test("Updates existing ingredient on existing step", async function () {
    const currentRecipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const newRecipe = {
      ...currentRecipe,
    };
    newRecipe.steps[0].ingredients[0] = {
      ...newRecipe.steps[0].ingredients[0],
      amount: "newAmount",
      description: "newDescription",
    };

    const result = await RecipeManager.updateRecipe(newRecipe);

    expect(result.steps[0].ingredients[0]).toEqual({
      ingredientId: currentRecipe.steps[0].ingredients[0].ingredientId,
      step: currentRecipe.steps[0].ingredients[0].step,
      amount: "newAmount",
      description: "newDescription",
    });
  });

  //Deletes missing ingredient from existing step
  test("Deletes ingredients from existing step", async function () {
    const currentRecipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const newRecipe = {
      ...currentRecipe,
    };
    newRecipe.steps[0].ingredients.pop();

    const result = await RecipeManager.updateRecipe(newRecipe);
    expect(result.steps[0].ingredients.length).toEqual(0);
  });

  //Adds new step*******************hangs
  test("Creates new steps", async function () {
    console.log('starting hanging test');
    const currentRecipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const newRecipe = {
      ...currentRecipe,
    };
    newRecipe.steps.push({
      stepNumber: 2,
      instructions: "newInstructions",
      ingredients: [
        {
          amount: "newAmount",
          description: "newDescription",
        }
      ]
    });
    console.log('hanging test 263')

    const result = await RecipeManager.updateRecipe(newRecipe);
    console.log('hanging test 266')

    expect(result.steps[1].recipeId).toEqual(currentRecipe.recipeId);
    expect(result.steps[1].stepId).toBeDefined();
    expect(result.steps[1].stepNumber).toEqual(2);
    expect(result.steps[1].instructions).toEqual("newInstructions");
    expect(result.steps[1].ingredients.length).toEqual(1);

    expect(result.steps[1].ingredients[0].ingredientId).toBeDefined();
    expect(result.steps[1].ingredients[0].step).toEqual(
      result.steps[1].stepId);
    expect(result.steps[1].ingredients[0].amount).toEqual(
      "newAmount"
    );
    expect(result.steps[1].ingredients[0].description).toEqual(
      "newDescription"
    );
  });

  //Updates existing step
  test("Updates existing step", async function () {
    const currentRecipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const newRecipe = {
      ...currentRecipe,
    };
    newRecipe.steps[0] = {
      ...currentRecipe.steps[0],
      stepNumber: 2,
      instructions: "newInstructions",
      ingredients: [
        {
          amount: "newAmount",
          description: "newDescription",
        }
      ]
    };

    const result = await RecipeManager.updateRecipe(newRecipe);
    expect(result.steps[0].recipeId).toEqual(currentRecipe.recipeId);
    expect(result.steps[0].stepId).toEqual(currentRecipe.steps[0].stepId);
    expect(result.steps[0].stepNumber).toEqual(2);
    expect(result.steps[0].instructions).toEqual("newInstructions");
    expect(result.steps[0].ingredients.length).toEqual(1);

    expect(result.steps[0].ingredients[0].ingredientId).toBeDefined();
    expect(result.steps[0].ingredients[0].step).toEqual(
      currentRecipe.steps[0].stepId);
    expect(result.steps[0].ingredients[0].amount).toEqual(
      "newAmount"
    );
    expect(result.steps[0].ingredients[0].description).toEqual(
      "newDescription"
    );


  });

  //Deletes missing step and its ingredients
  test("Deletes missing step and its ingredients", async function () {
    const currentRecipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const newRecipe = {
      ...currentRecipe,
    };
    const deletedIngredientId = currentRecipe.steps[0].ingredients[0].ingredientId;
    newRecipe.steps.pop();

    const result = await RecipeManager.updateRecipe(newRecipe);

    expect(result.steps.length).toEqual(0);

    const updatedRecipe = await RecipeManager.getRecipeById(currentRecipe.recipeId);
    expect(updatedRecipe.steps.length).toEqual(0);

    //ingredients should be deleted from database
    try {
      await prisma.ingredient.findUniqueOrThrow({
        where: { ingredientId: deletedIngredientId }
      });
      throw new Error("Fail test. You shouldn't get here");
    } catch (err) {
      expect(err instanceof Prisma.PrismaClientKnownRequestError).toBeTruthy();
    }

  });

//   // test failed transaction throws an error
//   // test("Failed transaction throws an error", async function () {
//   //   const recipeWithInvalidStep = {
//   //     ...userSubmittedRecipe1,
//   //   }
//   //   recipeWithInvalidStep.steps[0].stepId = -1;

//   //   try {
//   //     await RecipeManager.updateRecipe(recipeWithInvalidStep);
//   //     throw new Error("Fail test, you shouldn't get here")
//   //   } catch (err){
//   //     expect(err).toEqual(new Error("Database Transaction Error"));
//   //   }
//   // })

});

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

    const result = RecipeManager.sortSteps(currentSteps, newSteps);

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
      stepNumber: 1,
      stepId: 1,
      ingredients: [],
      instructions: "testInstructions"
    }];

    const result = RecipeManager.sortSteps(currentSteps, newSteps);

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
      stepNumber: 1,
      ingredients: [],
      instructions: "testInstructions"
    }];

    const result = RecipeManager.sortSteps(currentSteps, newSteps);
    expect(result).toEqual({
      toDelete: [],
      toUpdate: [],
      toCreate: newSteps,
    });
  });
});

describe("Test createStep", function () {
  test("Creates a step", async function () {
    console.log("running test for create a step")
    const recipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const step: IStepForUpdate = {
      stepNumber: 2,
      instructions: "R2S2Instructions",
      ingredients: []
    };

    const result = await RecipeManager.createStep(step, recipe.recipeId);
    expect(result.recipeId).toEqual(recipe.recipeId);
    expect(result.stepId).toBeDefined();
    expect(result.stepNumber).toEqual(2);
    expect(result.instructions).toEqual("R2S2Instructions");
    expect(result.ingredients).toEqual([]);

  });
});

describe("Test updateStep", function () {
  //updates base data
  test("Updates base step data", async function () {
    const recipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const newStep = {
      ...recipe.steps[0],
      stepNumber: 2,
      instructions: "newInstructions",
    };

    const result = await RecipeManager.updateStep(newStep);

    expect(result).toEqual({
      ...recipe.steps[0],
      stepNumber: 2,
      instructions: "newInstructions",
    });
  });

  //deletes extra ingredients
  test("Deletes extra ingredients", async function () {
    const recipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const newStep = {
      ...recipe.steps[0],
      ingredients: [],
    };

    const result = await RecipeManager.updateStep(newStep);

    expect(result).toEqual({
      ...recipe.steps[0],
      ingredients: [],
    });

    try {
      await prisma.ingredient.findUniqueOrThrow({
        where: { ingredientId: recipe.steps[0].ingredients[0].ingredientId }
      });
      throw new Error("Fail test. You shouldn't get here");
    } catch (err) {
      expect(err instanceof PrismaClientKnownRequestError).toBeTruthy();
    }
  });

  //creates new ingredients
  test("Creates new ingredients", async function () {
    const recipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const newStep = {
      ...recipe.steps[0],
    };
    newStep.ingredients.push({
      amount: "testAmount",
      description: "testDescription"
    });

    const result = await RecipeManager.updateStep(newStep);

    expect(result.ingredients.length).toEqual(2);
    expect(result.ingredients[1].amount).toEqual("testAmount");
    expect(result.ingredients[1].description).toEqual("testDescription");
    expect(result.ingredients[1].step).toEqual(newStep.stepId);
    expect(result.ingredients[1].ingredientId).toBeDefined();

  });

  //updates existing ingredients
  test("Creates new ingredients", async function () {
    const recipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const newStep = {
      ...recipe.steps[0],
    };
    console.log("initial step data", newStep)
    newStep.ingredients[0]={
      ...newStep.ingredients[0],
      amount: "testAmount",
      description: "testDescription"
    };
    console.log("updated step data", newStep)

    const result = await RecipeManager.updateStep(newStep);
    console.log("result", result)
    expect(result).toEqual(newStep)
  });
});


/**************** DELETE BY ID **************************/
describe("Test deleteRecipeById", function () {

  test("Deletes the correct record", async function () {
    const recipe1 = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const deletedRecipe = await RecipeManager.deleteRecipeById(recipe1.recipeId);

    expect(deletedRecipe.name).toEqual("R1Name");
    expect(deletedRecipe.description).toEqual("R1Description");
    expect(deletedRecipe.sourceUrl).toEqual("http://R1SourceUrl.com");
    expect(deletedRecipe.sourceName).toEqual("R1SourceName");

    try {
      await RecipeManager.getRecipeById(recipe1.recipeId);
      throw new Error("Fail test.  You shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("Deletes submodel data", async function () {
    const recipe1 = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const deletedRecipe = await RecipeManager.deleteRecipeById(recipe1.recipeId);

    const stepId = deletedRecipe.steps[0].stepId;
    const ingredientId = deletedRecipe.steps[0].ingredients[0].ingredientId;

    expect(
      await prisma.step.findUnique({
        where: {
          stepId: stepId,
        }
      })
    ).toBe(null);

    expect(
      await prisma.ingredient.findUnique({
        where: {
          ingredientId: ingredientId,
        }
      })
    ).toBe(null);

  });

  test("Returns the correct record", async function () {
    const recipe1 = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const result = await RecipeManager.deleteRecipeById(recipe1.recipeId);

    expect(result.name).toEqual("R1Name");
    expect(result.description).toEqual("R1Description");
    expect(result.sourceUrl).toEqual("http://R1SourceUrl.com");
    expect(result.sourceName).toEqual("R1SourceName");
  });

  test("Returns submodel data", async function () {
    const recipe1 = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const result = await RecipeManager.deleteRecipeById(recipe1.recipeId);

    expect(result.steps[0].stepNumber).toEqual(1);
    expect(result.steps[0].instructions).toEqual("R1S1Instructions");
    expect(result.steps[0].ingredients[0].amount)
      .toEqual("R1S1I1Amount");
    expect(result.steps[0].ingredients[0].description)
      .toEqual("R1S1I1Description");
  });

  test("Throws a NotFound error if record doesn't exist", async function () {
    await RecipeManager.saveRecipe(userSubmittedRecipe1);

    try {
      await RecipeManager.deleteRecipeById(0);
      throw new Error("Fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

});


/**************** _INTERNAL METHODS **************************/
describe("Test _pojoToPrismaRecipeInput", function () {
  test("Returns correct object", function () {
    expect(RecipeManager._pojoToPrismaRecipeInput(userSubmittedRecipe1)).toEqual({
      name: "R1Name",
      description: "R1Description",
      sourceUrl: "http://R1SourceUrl.com",
      sourceName: "R1SourceName",
      steps: {
        create: [
          {
            stepNumber: 1,
            instructions: "R1S1Instructions",
            ingredients: {
              create: [{
                amount: "R1S1I1Amount",
                description: "R1S1I1Description"
              }]
            }
          }
        ]
      }

    });
  });
});