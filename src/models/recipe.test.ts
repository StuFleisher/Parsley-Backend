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

jest.mock('./step', () => {
  return {
    createStep: jest.fn(),
    updateStep: jest.fn(),
    deleteStepById: jest.fn(),
    sortSteps: jest.fn(),
  };
});
const StepManager = require('./step')

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
    expect(prisma.recipe.create).toHaveBeenCalledWith({
      data: {
        description:"R1Description",
        name:"R1Name",
        sourceName:"R1SourceName",
        sourceUrl:"http://R1SourceUrl.com",
        steps:{
          create:[{
            instructions: "R1S1Instructions",
            stepNumber: 1,
            ingredients:{
              create:[{
                amount:"R1S1I1Amount",
                description:"R1S1I1Description",
              }]
            }
          }]
        }
      },
      include: {
        steps: {
          include: {
            ingredients: true,
          }
        }
      }
    });
    expect(recipe).toEqual(storedRecipe1);
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

//**************** GET BY ID **************************/
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

  const updatedIngredient = {
    ingredientId:1,
    step:1,
    amount: "R1S1I1Amount",
    description: "R1S1I1Description"
  }

  const updatedStep = {
    recipeId:1,
    stepId:1,
    stepNumber: 1,
    instructions: "UpdatedInstructions",
  }

  const updatedRecipe = {
    recipeId:1,
    name: "UpdatedName",
    description: "UpdatedDescription",
    sourceUrl: "http://updatedSourceUrl.com",
    sourceName: "updatedSourceName",
  }

  //Updates base recipe data
  test("Updates base recipe data", async function () {
    // set up test data
    const recipeBeforeUpdate = {
      ...storedRecipe1,
      steps:[],
    }
    const recipeAfterUpdate:RecipeData = {
      recipeId:1,
      name: 'newName',
      description: 'newDescription',
      sourceName: 'newSourceName',
      sourceUrl: 'newSourceUrl',
      steps:[],
    }

    //mock dependencies
    const getRecipeByIdSpy = jest.spyOn(RecipeManager,'getRecipeById')
      .mockReturnValueOnce(recipeBeforeUpdate)
      .mockReturnValueOnce(recipeAfterUpdate)


    prisma.recipe.findUniqueOrThrow.mockReturnValueOnce(recipeBeforeUpdate)
    prisma.$transaction.mockImplementation(async (transaction: Function)=>{
      await transaction();
    })
    prisma.recipe.update.mockReturnValueOnce(recipeAfterUpdate);
    const _updateRecipeSteps = (
      jest.spyOn(RecipeManager, '_updateRecipeSteps')
    );
    _updateRecipeSteps.mockImplementationOnce(()=>{})

    //do test
    const result = await RecipeManager.updateRecipe(recipeAfterUpdate);

    expect(getRecipeByIdSpy).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.recipe.update).toHaveBeenCalledWith({
      where: { recipeId: recipeBeforeUpdate.recipeId },
      data: {
        name: recipeAfterUpdate.name,
        description: recipeAfterUpdate.description,
        sourceName: recipeAfterUpdate.sourceName,
        sourceUrl: recipeAfterUpdate.sourceUrl,
      },
    })
    expect(_updateRecipeSteps).toHaveBeenCalledTimes(1);

    expect(result).toEqual(recipeAfterUpdate)
  });


// /**************** DELETE BY ID **************************/
// describe("Test deleteRecipeById", function () {

//   test("Deletes the correct record", async function () {
//     const recipe1 = await RecipeManager.saveRecipe(userSubmittedRecipe1);
//     const deletedRecipe = await RecipeManager.deleteRecipeById(recipe1.recipeId);

//     expect(deletedRecipe.name).toEqual("R1Name");
//     expect(deletedRecipe.description).toEqual("R1Description");
//     expect(deletedRecipe.sourceUrl).toEqual("http://R1SourceUrl.com");
//     expect(deletedRecipe.sourceName).toEqual("R1SourceName");

//     try {
//       await RecipeManager.getRecipeById(recipe1.recipeId);
//       throw new Error("Fail test.  You shouldn't get here");
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });

//   test("Deletes submodel data", async function () {
//     const recipe1 = await RecipeManager.saveRecipe(userSubmittedRecipe1);
//     const deletedRecipe = await RecipeManager.deleteRecipeById(recipe1.recipeId);

//     const stepId = deletedRecipe.steps[0].stepId;
//     const ingredientId = deletedRecipe.steps[0].ingredients[0].ingredientId;

//     expect(
//       await prisma.step.findUnique({
//         where: {
//           stepId: stepId,
//         }
//       })
//     ).toBe(null);

//     expect(
//       await prisma.ingredient.findUnique({
//         where: {
//           ingredientId: ingredientId,
//         }
//       })
//     ).toBe(null);

//   });

//   test("Returns the correct record", async function () {
//     const recipe1 = await RecipeManager.saveRecipe(userSubmittedRecipe1);
//     const result = await RecipeManager.deleteRecipeById(recipe1.recipeId);

//     expect(result.name).toEqual("R1Name");
//     expect(result.description).toEqual("R1Description");
//     expect(result.sourceUrl).toEqual("http://R1SourceUrl.com");
//     expect(result.sourceName).toEqual("R1SourceName");
//   });

//   test("Returns submodel data", async function () {
//     const recipe1 = await RecipeManager.saveRecipe(userSubmittedRecipe1);
//     const result = await RecipeManager.deleteRecipeById(recipe1.recipeId);

//     expect(result.steps[0].stepNumber).toEqual(1);
//     expect(result.steps[0].instructions).toEqual("R1S1Instructions");
//     expect(result.steps[0].ingredients[0].amount)
//       .toEqual("R1S1I1Amount");
//     expect(result.steps[0].ingredients[0].description)
//       .toEqual("R1S1I1Description");
//   });

//   test("Throws a NotFound error if record doesn't exist", async function () {
//     await RecipeManager.saveRecipe(userSubmittedRecipe1);

//     try {
//       await RecipeManager.deleteRecipeById(0);
//       throw new Error("Fail test, you shouldn't get here");
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });

// });


// /**************** _INTERNAL METHODS **************************/

describe("Test _updateRecipeSteps", function () {
  test("Creates steps correctly", function () {

    const currentSteps:IStep[] = [];
    const revisedSteps:IStepForUpdate[] = [{
      recipeId:1,
      stepNumber:1,
      instructions:"newInstructions",
      ingredients:[]
    }]

    //mock dependencies
    StepManager.sortSteps.mockReturnValueOnce({
      toUpdate:[],
      toCreate:revisedSteps,
      toDelete:[],
    })
    StepManager.createStep.mockReturnValueOnce({
      ...revisedSteps[0],
      stepId:1,
    })

    //do test
    const recipe = RecipeManager._updateRecipeSteps(
      currentSteps,
      revisedSteps,
      1,
    );

    expect(StepManager.createStep).toHaveBeenCalledWith(
      revisedSteps[0],
      1
    )
    expect(StepManager.createStep).toHaveBeenCalledTimes(1)

  });


  test("Deletes steps correctly", function () {

    const currentSteps:IStepForUpdate[] = [{
      recipeId:1,
      stepNumber:1,
      instructions:"Instructions",
      ingredients:[],
      stepId:100
    }]
    const revisedSteps:IStep[] = [];

    //mock dependencies
    StepManager.sortSteps.mockReturnValueOnce({
      toUpdate:[],
      toCreate:[],
      toDelete:currentSteps,
    })
    StepManager.deleteStepById.mockReturnValueOnce(currentSteps[0])

    //do test
    const recipe = RecipeManager._updateRecipeSteps(
      currentSteps,
      revisedSteps,
      1,
    );

    expect(StepManager.deleteStepById).toHaveBeenCalledWith(100)
    expect(StepManager.createStep).toHaveBeenCalledTimes(1)

  });

  test("Deletes steps correctly", function () {

    const currentSteps:IStepForUpdate[] = [{
      recipeId:1,
      stepNumber:1,
      instructions:"instructions",
      ingredients:[],
      stepId:100
    }]
    const revisedSteps:IStep[] = [{
      recipeId:1,
      stepNumber:2,
      instructions:"newInstructions",
      ingredients:[],
      stepId:100
    }];

    //mock dependencies
    StepManager.sortSteps.mockReturnValueOnce({
      toUpdate:revisedSteps,
      toCreate:[],
      toDelete:[],
    })
    StepManager.updateStep.mockReturnValueOnce(revisedSteps[0])

    //do test
    const recipe = RecipeManager._updateRecipeSteps(
      currentSteps,
      revisedSteps,
      1,
    );

    expect(StepManager.updateStep).toHaveBeenCalledWith(revisedSteps[0])
    expect(StepManager.updateStep).toHaveBeenCalledTimes(1)

  });


});


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