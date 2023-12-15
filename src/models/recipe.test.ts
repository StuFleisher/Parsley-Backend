"use strict";

import { Prisma } from "@prisma/client";

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
require('../config'); //this loads the test database
const prisma = require('../client');
const RecipeFactory = require('./recipe');
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  userSubmittedRecipe1,
  userSubmittedRecipe2,
} = require('../test/test_common');
const { NotFoundError } = require('../utils/expressError');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);

/********************** CREATE *******************************/
describe("Test Create Recipe", function () {

  test("Returns the correct Recipe with id", async function () {
    const recipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    expect(recipe).toHaveProperty("recipeId");
    expect(recipe.name).toEqual("R1Name");
    expect(recipe.description).toEqual("R1Description");
    expect(recipe.sourceUrl).toEqual("http://R1SourceUrl.com");
    expect(recipe.sourceName).toEqual("R1SourceName");
  });

  test("Returns with submodel data", async function () {
    const recipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    expect(recipe.steps[0].stepNumber).toEqual(1);
    expect(recipe.steps[0].instructions).toEqual("R1S1Instructions");

    expect(recipe.steps[0].ingredients[0].amount)
      .toEqual("R1S1I1Amount");
    expect(recipe.steps[0].ingredients[0].description)
      .toEqual("R1S1I1Description");
  });

  test("Creates a record in the database", async function () {
    const recipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);

    const result: RecipeData = await prisma.recipe.findUnique({
      where: {
        recipeId: recipe.recipeId,
      },
      include: {
        steps: {
          include: {
            ingredients: true
          }
        }
      }
    });

    expect(result.name).toEqual(userSubmittedRecipe1.name);
    expect(result.description).toEqual(userSubmittedRecipe1.description);
    expect(result.sourceUrl).toEqual(userSubmittedRecipe1.sourceUrl);
    expect(result.sourceName).toEqual(userSubmittedRecipe1.sourceName);
  });

  test("Creates submodel records in the database", async function () {
    const recipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);

    const result: RecipeData = await prisma.recipe.findUnique({
      where: {
        recipeId: recipe.recipeId,
      },
      include: {
        steps: {
          include: {
            ingredients: true
          }
        }
      }
    });

    expect(result.steps[0].stepNumber).toEqual(1);
    expect(result.steps[0].instructions).toEqual("R1S1Instructions");

    expect(result.steps[0].ingredients[0].amount)
      .toEqual("R1S1I1Amount");
    expect(result.steps[0].ingredients[0].description)
      .toEqual("R1S1I1Description");
  });
});


/**************** GET ALL **************************/
describe("Test getAllRecipes", function () {

  test("Returns multiple recipes", async function () {
    const recipe1 = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const recipe2 = await RecipeFactory.saveRecipe(userSubmittedRecipe2);
    const recipes = await RecipeFactory.getAllRecipes();

    expect(recipes.length).toEqual(2);
  });

  test("Does not return submodel data", async function () {
    const recipe1 = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const recipe2 = await RecipeFactory.saveRecipe(userSubmittedRecipe2);
    const recipes = await RecipeFactory.getAllRecipes();

    expect(recipes[0]).not.toHaveProperty("steps");
  });
});

/**************** GET BY ID **************************/
describe("Test getRecipeById", function () {

  test("Returns the correct record", async function () {
    const recipe1 = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const result = await RecipeFactory.getRecipeById(recipe1.recipeId);

    expect(result.name).toEqual("R1Name");
    expect(result.description).toEqual("R1Description");
    expect(result.sourceUrl).toEqual("http://R1SourceUrl.com");
    expect(result.sourceName).toEqual("R1SourceName");
  });

  test("Returns submodel data", async function () {
    const recipe1 = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const result = await RecipeFactory.getRecipeById(recipe1.recipeId);

    expect(result.steps[0].stepNumber).toEqual(1);
    expect(result.steps[0].instructions).toEqual("R1S1Instructions");
    expect(result.steps[0].ingredients[0].amount)
      .toEqual("R1S1I1Amount");
    expect(result.steps[0].ingredients[0].description)
      .toEqual("R1S1I1Description");
  });

  test("Throws a NotFound error if record doesn't exist", async function () {
    const recipe1 = await RecipeFactory.saveRecipe(userSubmittedRecipe1);

    try {
      await RecipeFactory.getRecipeById(0);
      throw new Error("Fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

});


/**************** UPDATE **************************/
describe("Test updateRecipe", function () {

  //Updates base recipe data
  test("Updates base recipe data", async function () {
    const currentRecipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const newRecipe = {
      ...currentRecipe,
      name: 'newName',
      description: 'newDescription',
      sourceName: 'newSourceName',
      sourceUrl: 'newSourceUrl'
    };

    const result = await RecipeFactory.updateRecipe(newRecipe);

    expect(result.name).toEqual("newName");
    expect(result.description).toEqual("newDescription");
    expect(result.sourceName).toEqual("newSourceName");
    expect(result.sourceUrl).toEqual("newSourceUrl");
  });

  //Adds new ingredient to existing step
  test("Adds new ingredient to existing step", async function () {
    const currentRecipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const newRecipe = {
      ...currentRecipe,
    };
    newRecipe.steps[0].ingredients.push({
      step: currentRecipe.steps[0].stepId,
      amount: "newAmount",
      description: "newDescription",
    });

    const result = await RecipeFactory.updateRecipe(newRecipe);

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
    const currentRecipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const newRecipe = {
      ...currentRecipe,
    };
    newRecipe.steps[0].ingredients[0] = {
      ...newRecipe.steps[0].ingredients[0],
      amount: "newAmount",
      description: "newDescription",
    };

    const result = await RecipeFactory.updateRecipe(newRecipe);

    expect(result.steps[0].ingredients[0]).toEqual({
      ingredientId: currentRecipe.steps[0].ingredients[0].ingredientId,
      step: currentRecipe.steps[0].ingredients[0].step,
      amount: "newAmount",
      description: "newDescription",
    });
  });

  //Deletes missing ingredient from existing step
  test("Deletes ingredients from existing step", async function () {
    const currentRecipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const newRecipe = {
      ...currentRecipe,
    };
    newRecipe.steps[0].ingredients.pop();
    console.log("newRecipe", newRecipe);

    const result = await RecipeFactory.updateRecipe(newRecipe);
    console.log("ingredients on result:", result.steps[0].ingredients);
    expect(result.steps[0].ingredients.length).toEqual(0);
  });

  //Adds new step
  test("Creates new steps", async function () {
    const currentRecipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
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

    const result = await RecipeFactory.updateRecipe(newRecipe);
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
    const currentRecipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
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

    const result = await RecipeFactory.updateRecipe(newRecipe);
    console.log("result", result);
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
    const currentRecipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const newRecipe = {
      ...currentRecipe,
    };
    const deletedIngredientId = currentRecipe.steps[0].ingredients[0].ingredientId
    newRecipe.steps.pop();

    const result = await RecipeFactory.updateRecipe(newRecipe);

    expect(result.steps.length).toEqual(0);

    const updatedRecipe = await RecipeFactory.getRecipeById(currentRecipe.recipeId)
    expect(updatedRecipe.steps.length).toEqual(0);

    //ingredients should be deleted from database
    try{
      await prisma.ingredient.findUniqueOrThrow({
        where:{ingredientId:deletedIngredientId}
      });
      throw new Error("Fail test. You shouldn't get here")
    } catch(err){
      expect(err instanceof Prisma.PrismaClientKnownRequestError).toBeTruthy();
    }

  });

});

describe("Tests for sortIngredients", function(){
  //sorts toDelete correctly
  test("Sorts toDelete correctly", async function(){
    const currentIngredients = [{
      ingredientId:1,
      amount:"testAmount",
      description:"testDescription"
    }];
    const newIngredients:IIngredientForUpdate[] = [];

    const result = RecipeFactory.sortIngredients(currentIngredients,newIngredients)

    expect(result).toEqual({
      toDelete:currentIngredients,
      toUpdate:[],
      toCreate:[],
    })
  })

  //sorts toUpdate correctly
  test("Sorts toUpdate correctly", async function(){
    const currentIngredients = [{
      ingredientId:1,
      amount:"testAmount",
      description:"testDescription"
    }];
    const newIngredients:IIngredientForUpdate[] = [{
      ingredientId:1,
      amount:"newAmount",
      description:"newDescription"
    }];

    const result = RecipeFactory.sortIngredients(currentIngredients,newIngredients)

    expect(result).toEqual({
      toDelete:[],
      toUpdate:newIngredients,
      toCreate:[],
    })
  })

  //sorts toCreate correctly
  test("Sorts toCreate correctly", async function(){
    const currentIngredients:IIngredient[] = [];
    const newIngredients:IIngredientForUpdate[] = [{
      amount:"newAmount",
      description:"newDescription"
    }];

    const result = RecipeFactory.sortIngredients(currentIngredients,newIngredients)

    expect(result).toEqual({
      toDelete:[],
      toUpdate:[],
      toCreate:newIngredients,
    })
  })
})

//************************ */
describe("Tests for sortSteps", function(){
  //sorts toDelete correctly
  test("Sorts toDelete correctly", async function(){
    const currentSteps:IStep[] = [{
      recipeId:1,
      stepNumber:1,
      stepId:1,
      ingredients:[],
      instructions:"testInstructions"
    }];
    const newSteps:IStepForUpdate[] = [];

    const result = RecipeFactory.sortSteps(currentSteps,newSteps)

    expect(result).toEqual({
      toDelete:currentSteps,
      toUpdate:[],
      toCreate:[],
    })
  })

  //sorts toUpdate correctly
  test("Sorts toUpdate correctly", async function(){
    const currentSteps:IStep[] = [{
      recipeId:1,
      stepNumber:1,
      stepId:1,
      ingredients:[],
      instructions:"testInstructions"
    }];
    const newSteps:IStepForUpdate[] = [{
      stepNumber:1,
      stepId:1,
      ingredients:[],
      instructions:"testInstructions"
    }];

    const result = RecipeFactory.sortSteps(currentSteps,newSteps)

    expect(result).toEqual({
      toDelete:[],
      toUpdate:newSteps,
      toCreate:[],
    })
  })

  //sorts toCreate correctly
  test("Sorts toCreate correctly", async function(){
    const currentSteps:IStep[] = [];
    const newSteps:IStepForUpdate[] = [{
      stepNumber:1,
      ingredients:[],
      instructions:"testInstructions"
    }];

    const result = RecipeFactory.sortSteps(currentSteps,newSteps)
    console.log("result",result);
    expect(result).toEqual({
      toDelete:[],
      toUpdate:[],
      toCreate:newSteps,
    })
  })
})


/**************** DELETE BY ID **************************/
describe("Test deleteRecipeById", function () {

  test("Deletes the correct record", async function () {
    const recipe1 = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const deletedRecipe = await RecipeFactory.deleteRecipeById(recipe1.recipeId);

    expect(deletedRecipe.name).toEqual("R1Name");
    expect(deletedRecipe.description).toEqual("R1Description");
    expect(deletedRecipe.sourceUrl).toEqual("http://R1SourceUrl.com");
    expect(deletedRecipe.sourceName).toEqual("R1SourceName");

    try {
      await RecipeFactory.getRecipeById(recipe1.recipeId);
      throw new Error("Fail test.  You shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("Deletes submodel data", async function () {
    const recipe1 = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const deletedRecipe = await RecipeFactory.deleteRecipeById(recipe1.recipeId);

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
    const recipe1 = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const result = await RecipeFactory.deleteRecipeById(recipe1.recipeId);

    expect(result.name).toEqual("R1Name");
    expect(result.description).toEqual("R1Description");
    expect(result.sourceUrl).toEqual("http://R1SourceUrl.com");
    expect(result.sourceName).toEqual("R1SourceName");
  });

  test("Returns submodel data", async function () {
    const recipe1 = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const result = await RecipeFactory.deleteRecipeById(recipe1.recipeId);

    expect(result.steps[0].stepNumber).toEqual(1);
    expect(result.steps[0].instructions).toEqual("R1S1Instructions");
    expect(result.steps[0].ingredients[0].amount)
      .toEqual("R1S1I1Amount");
    expect(result.steps[0].ingredients[0].description)
      .toEqual("R1S1I1Description");
  });

  test("Throws a NotFound error if record doesn't exist", async function () {
    await RecipeFactory.saveRecipe(userSubmittedRecipe1);

    try {
      await RecipeFactory.deleteRecipeById(0);
      throw new Error("Fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

});


/**************** _INTERNAL METHODS **************************/
describe("Test _pojoToPrismaRecipeInput", function () {
  test("Returns correct object", function () {
    expect(RecipeFactory._pojoToPrismaRecipeInput(userSubmittedRecipe1)).toEqual({
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