import '../config'; //this loads the test database
import { prismaMock as prisma } from '../prismaSingleton';

import { jest } from '@jest/globals';

jest.mock('../api/s3', () => {
  return {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };
});
import * as s3 from '../api/s3';
const mockedS3 = (
  s3 as jest.Mocked<typeof s3>
);

jest.mock('./step', () => {
  return {
    createStep: jest.fn(),
    updateStep: jest.fn(),
    deleteStepById: jest.fn(),
    sortSteps: jest.fn(),
  };
});
import StepManager from './step';
const mockedStepManager = (
  StepManager as jest.Mocked<typeof StepManager>
);

import RecipeManager from './recipe';
import {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  newRecipeSubmission,
  createdRecipe,
  storedRecipe1,
  testDate,
} from '../test/test_common';
import { BadRequestError, NotFoundError } from '../utils/expressError';
import { error } from 'console';

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);


/********************** CREATE *******************************/
describe("Test Create Recipe", function () {


  test("Returns created model with submodels", async function () {

    //set up mocks
    prisma.recipe.create.mockResolvedValueOnce({
      recipeId: 1,
      "name": "R1Name",
      "description": "R1Description",
      "sourceUrl": "http://R1SourceUrl.com",
      "sourceName": "R1SourceName",
      "imageSm": "http://R1ImageUrl.com/sm",
      "imageMd": "http://R1ImageUrl.com/md",
      "imageLg": "http://R1ImageUrl.com/lg",
      "owner": "u1",
      createdTime: testDate,
    });

    mockedStepManager.createStep.mockResolvedValue({
      stepId: 1,
      "instructions": "R1S1Instructions",
      "recipeId": 1,
      "stepNumber": 1,
      "ingredients": [{
        ingredientId: 1,
        "amount": "R1S1I1Amount",
        "description": "R1S1I1Description",
        "instructionRef": "R1S1I1InstructionRef",
        "step": 1
      }],
    });

    prisma.recipe.findUniqueOrThrow.mockResolvedValueOnce(createdRecipe);

    //run test
    const recipe = await RecipeManager.saveRecipe(newRecipeSubmission);

    expect(prisma.recipe.create).toHaveBeenCalledWith({
      "data": {
        "description": "R1Description",
        "imageSm": "http://R1ImageUrl.com/sm",
        "imageMd": "http://R1ImageUrl.com/md",
        "imageLg": "http://R1ImageUrl.com/lg",
        "name": "R1Name",
        "owner": "u1",
        "sourceName": "R1SourceName",
        "sourceUrl": "http://R1SourceUrl.com",
        "tags": {
          "connectOrCreate": [{
            "create": { "name": "R1Tag1" },
            "where": { "name": "R1Tag1" }
          }]
        },
      },
      "include":{"tags":true},
    });
    expect(prisma.recipe.create).toHaveBeenCalledTimes(1);
    expect(mockedStepManager.createStep).toHaveBeenCalledWith({
      "ingredients": [{
        "amount": "R1S1I1Amount",
        "description": "R1S1I1Description",
        "instructionRef": "R1S1I1InstructionRef",
      }],
      "instructions": "R1S1Instructions",
      "recipeId": 1,
      "stepNumber": 1
    });
    expect(mockedStepManager.createStep).toHaveBeenCalledTimes(1);

    expect(recipe).toEqual(storedRecipe1);
  });
});


/**************** GET ALL **************************/
describe("Test getAllRecipes", function () {

  const queryResult = [
    {
      recipeId: 1,
      name: "R1Name",
      description: "R1Description",
      sourceUrl: "http://R1SourceUrl.com",
      sourceName: "R1SourceName",
      "imageSm": "http://R1ImageUrl.com/sm",
      "imageMd": "http://R1ImageUrl.com/md",
      "imageLg": "http://R1ImageUrl.com/lg",
      owner: "u1",
      createdTime: testDate,
    },
    {
      recipeId: 2,
      name: "R2Name",
      description: "R2Description",
      sourceUrl: "http://R2SourceUrl.com",
      sourceName: "R2SourceName",
      "imageSm": "http://R2ImageUrl.com/sm",
      "imageMd": "http://R2ImageUrl.com/md",
      "imageLg": "http://R2ImageUrl.com/lg",
      owner: "u2",
      createdTime: testDate,
    },
  ];

  test("Works without query", async function () {
    prisma.recipe.findMany.mockResolvedValueOnce(queryResult);

    const recipes = await RecipeManager.getAllRecipes();
    expect(recipes.length).toEqual(2);
    expect(recipes).toEqual(queryResult);
  });

  test("Works with query", async function () {
    console.log(queryResult[0]);
    prisma.recipe.findMany.mockResolvedValueOnce([queryResult[0]]);

    const recipes = await RecipeManager.getAllRecipes('R1Name');
    expect(prisma.recipe.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { search: "R1Name", "mode": "insensitive" } },
          { description: { search: "R1Name", "mode": "insensitive" } },
          { steps: { some: { instructions: { search: "R1Name","mode": "insensitive" } } } },
          { steps: { some: { ingredients: { some: { description: { search: "R1Name", "mode": "insensitive" } } } } } },
        ]
      },
      include:{tags:true},
      orderBy: [{
        _relevance: {
          fields: ["name", "description"],
          search: "R1Name",
          sort: 'desc',
        }
      }]
    }

    );
    expect(recipes.length).toEqual(1);
    expect(recipes).toEqual([queryResult[0]]);
  });



  test("Does not return submodel data", async function () {
    prisma.recipe.findMany.mockResolvedValueOnce(queryResult);

    const recipes = await RecipeManager.getAllRecipes();
    expect(recipes[0]).not.toHaveProperty("steps");
  });
});


describe("Test getRecipesByTag", function () {

  const queryResult ={
    name: "testTag",
    recipes:[
    {
      recipeId: 1,
      name: "R1Name",
      description: "R1Description",
      sourceUrl: "http://R1SourceUrl.com",
      sourceName: "R1SourceName",
      "imageSm": "http://R1ImageUrl.com/sm",
      "imageMd": "http://R1ImageUrl.com/md",
      "imageLg": "http://R1ImageUrl.com/lg",
      owner: "u1",
      createdTime: testDate,
      tags:[{name:"testTag"}]
    },
    {
      recipeId: 2,
      name: "R2Name",
      description: "R2Description",
      sourceUrl: "http://R2SourceUrl.com",
      sourceName: "R2SourceName",
      "imageSm": "http://R2ImageUrl.com/sm",
      "imageMd": "http://R2ImageUrl.com/md",
      "imageLg": "http://R2ImageUrl.com/lg",
      owner: "u2",
      createdTime: testDate,
      tags:[{name:"testTag"}]
    },
  ]};

  test("Works ", async function () {
    prisma.tag.findUniqueOrThrow.mockResolvedValueOnce(queryResult);

    const recipes = await RecipeManager.getRecipesByTag("testTag");
    expect(recipes.length).toEqual(2);
    expect(recipes).toEqual(queryResult.recipes);
  })

})

//**************** GET BY ID **************************/
describe("Test getRecipeById", function () {

  test("Returns the correct record with submodels", async function () {
    prisma.recipe.findUniqueOrThrow.mockResolvedValueOnce(storedRecipe1);

    const result = await RecipeManager.getRecipeById(1);

    expect(result).toEqual(storedRecipe1);
  });

  test("Throws a NotFound error if record doesn't exist", async function () {
    prisma.recipe.findUniqueOrThrow.mockImplementationOnce(() => {
      throw new Error();
    });

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
    ingredientId: 1,
    step: 1,
    amount: "R1S1I1Amount",
    description: "R1S1I1Description"
  };

  const updatedStep = {
    recipeId: 1,
    stepId: 1,
    stepNumber: 1,
    instructions: "UpdatedInstructions",
  };

  const updatedRecipe = {
    recipeId: 1,
    name: "UpdatedName",
    description: "UpdatedDescription",
    sourceUrl: "http://updatedSourceUrl.com",
    sourceName: "updatedSourceName",
    imageUrl: "http://R1ImageUrl.com",
  };

  //Updates base recipe data
  test("Updates base recipe data", async function () {

    // set up test data
    const recipeBeforeUpdate = {
      ...storedRecipe1,
      steps: [],
    };
    const recipeAfterUpdate: RecipeData = {
      recipeId: 1,
      name: 'newName',
      description: 'newDescription',
      sourceName: 'newSourceName',
      sourceUrl: 'newSourceUrl',
      "imageSm": "http://R1ImageUrl.com/sm",
      "imageMd": "http://R1ImageUrl.com/md",
      "imageLg": "http://R1ImageUrl.com/lg",
      owner: "u1",
      createdTime: testDate,
      steps: [],
      tags: []
    };

    //mock dependencies
    const getRecipeByIdSpy = jest.spyOn(RecipeManager, 'getRecipeById')
      .mockResolvedValueOnce(recipeBeforeUpdate)
      .mockResolvedValueOnce(recipeAfterUpdate);
    prisma.recipe.findUniqueOrThrow.mockResolvedValueOnce(recipeBeforeUpdate);
    prisma.$transaction.mockImplementation(async (transaction: Function) => {
      await transaction();
    });
    prisma.recipe.update.mockResolvedValueOnce(recipeAfterUpdate);
    const _updateRecipeSteps = (
      jest.spyOn(RecipeManager, '_updateRecipeSteps')
    );
    _updateRecipeSteps.mockImplementationOnce(async () => { });

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
        imageSm: recipeAfterUpdate.imageSm,
        imageMd: recipeAfterUpdate.imageMd,
        imageLg: recipeAfterUpdate.imageLg,
        tags:{
          connectOrCreate:[]
        }
      },
    });
    expect(_updateRecipeSteps).toHaveBeenCalledTimes(1);

    expect(result).toEqual(recipeAfterUpdate);
  });

  test("Error on failed transaction", async function () {

    const recipeBeforeUpdate = {
      ...storedRecipe1,
      steps: [],
    };
    const recipeAfterUpdate: RecipeData = {
      recipeId: 1,
      name: 'newName',
      description: 'newDescription',
      sourceName: 'newSourceName',
      sourceUrl: 'newSourceUrl',
      imageSm: "newImageUrl/sm",
      imageMd: "newImageUrl/md",
      imageLg: "newImageUrl/lg",
      owner: "u1",
      createdTime: testDate,
      steps: [],
      tags: [],
    };

    //mock dependencies
    jest.spyOn(RecipeManager, 'getRecipeById')
      .mockResolvedValueOnce(recipeBeforeUpdate)
      .mockResolvedValueOnce(recipeAfterUpdate);

    prisma.recipe.findUniqueOrThrow.mockResolvedValueOnce(recipeBeforeUpdate);
    prisma.$transaction.mockImplementation(async (transaction: Function) => {
      await transaction();
    });
    //simulate transaction error
    prisma.recipe.update.mockImplementationOnce(() => {
      throw new Error("error in transaction");
    });

    //do test
    try {
      const result = await RecipeManager.updateRecipe(recipeAfterUpdate);
      throw new Error("Fail test, you shouldn't get here");
    } catch (err) {
      expect(err.message).toEqual("Database Transaction Error");
    }
  });

});

// /**************** DELETE BY ID **************************/
describe("Test deleteRecipeById", function () {

  test("Returns the correct record with submodel data", async function () {

    //mock dependencies
    mockedS3.deleteFile.mockResolvedValueOnce(undefined as any);
    prisma.recipe.delete.mockResolvedValueOnce(storedRecipe1);
    //do test
    const result = await RecipeManager.deleteRecipeById(1);

    expect(prisma.recipe.delete).toHaveBeenCalledWith({

      where: { recipeId: 1 },
      include: {
        steps: {
          include: {
            ingredients: true,
          }
        },
        tags:true,
      },
    });
    expect(result).toEqual(storedRecipe1);

  });


  test("Throws a NotFound error if record doesn't exist", async function () {
    prisma.recipe.delete.mockImplementationOnce(() => {
      throw new Error();
    });

    try {
      await RecipeManager.deleteRecipeById(0);
      throw new Error("Fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(err.message).toEqual("Recipe not found");
    }
  });

});

// /**************** FAVORITES METHODS **************************/

describe("addToFavorites", function () {

  const validResponse = {
    favoriteId: 1,
    recipeId: 1,
    username: "u1"
  };

  test("works", async function () {
    prisma.favorite.count.mockResolvedValueOnce(0);
    prisma.favorite.create.mockResolvedValueOnce(validResponse);

    const entry = await RecipeManager.addToFavorites(1, "u1");

    expect(prisma.favorite.create).toHaveBeenCalledWith({
      data: {
        username: "u1",
        recipeId: 1,
      }
    });
    expect(entry).toEqual(validResponse);
  });

  test("BadRequest on existing record", async function () {
    prisma.favorite.count.mockResolvedValueOnce(1);

    try {
      await RecipeManager.addToFavorites(1, "u1");
      throw new Error("Fail test. You shouldn't get here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
      expect(err.message).toEqual("Recipe already in favorites");
    }

  });

  test("BadRequest on bad args", async function () {
    const mockCreate = async function () {
      throw new Error("fail create");
    } as any;

    prisma.favorite.count.mockResolvedValueOnce(0);
    prisma.favorite.create.mockImplementationOnce(mockCreate);

    try {
      await RecipeManager.addToFavorites(1, "badUsername");
      throw new Error("Fail test. You shouldn't get here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
      expect(err.message).toEqual(
        "Database transaction failed. Are recipeId and username correct?"
      );
    }
  });
});

describe("removeFromFavorites", function () {
  const validResult = {
    removed: {
      recipeId: 1,
      username: "u1",
    }
  };

  test("", async function () {
    prisma.favorite.count.mockResolvedValueOnce(1);
    prisma.favorite.deleteMany.mockResolvedValueOnce({ count: 1 });

    let result = await RecipeManager.removeFromFavorites(1, "u1");

    expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
      where: {
        username: "u1",
        recipeId: 1,
      }
    });
    expect(result).toEqual(validResult);
  });

  test("BadRequest on missing favorite", async function () {
    prisma.favorite.count.mockResolvedValueOnce(0);

    try {
      await RecipeManager.removeFromFavorites(1, "u1");
      throw new Error("Fail test. You shouldn't get here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
      expect(err.message).toEqual("No favorites entry to remove");
    }
  });

});


// /**************** _INTERNAL METHODS **************************/

describe("Test _updateRecipeSteps", function () {
  test("Creates steps correctly", function () {

    const currentSteps: Step[] = [];
    const revisedSteps: StepForCreate[] = [{
      recipeId: 1,
      stepNumber: 1,
      instructions: "newInstructions",
      ingredients: []
    }];

    //mock dependencies
    mockedStepManager.sortSteps.mockReturnValueOnce({
      toUpdate: [],
      toCreate: revisedSteps,
      toDelete: [],
    });
    mockedStepManager.createStep.mockResolvedValueOnce({
      ...revisedSteps[0],
      stepId: 1,
    } as any);

    //do test
    const recipe = RecipeManager._updateRecipeSteps(
      currentSteps,
      revisedSteps,
      1,
    );

    expect(mockedStepManager.createStep).toHaveBeenCalledWith(
      revisedSteps[0]
    );
    expect(mockedStepManager.createStep).toHaveBeenCalledTimes(1);

  });


  test("Deletes steps correctly", function () {

    const currentSteps: Step[] = [{
      recipeId: 1,
      stepNumber: 1,
      instructions: "Instructions",
      ingredients: [],
      stepId: 100,
    }];
    const revisedSteps: Step[] = [];

    //mock dependencies
    mockedStepManager.sortSteps.mockReturnValueOnce({
      toUpdate: [],
      toCreate: [],
      toDelete: currentSteps,
    });
    mockedStepManager.deleteStepById.mockResolvedValueOnce(currentSteps[0]);

    //do test
    const recipe = RecipeManager._updateRecipeSteps(
      currentSteps,
      revisedSteps,
      1,
    );

    expect(mockedStepManager.deleteStepById).toHaveBeenCalledWith(100);
    expect(mockedStepManager.deleteStepById).toHaveBeenCalledTimes(1);

  });

  test("Deletes steps correctly", function () {

    const currentSteps: Step[] = [{
      recipeId: 1,
      stepNumber: 1,
      instructions: "instructions",
      ingredients: [],
      stepId: 100
    }];
    const revisedSteps: Step[] = [{
      recipeId: 1,
      stepNumber: 2,
      instructions: "newInstructions",
      ingredients: [],
      stepId: 100
    }];

    //mock dependencies
    mockedStepManager.sortSteps.mockReturnValueOnce({
      toUpdate: revisedSteps,
      toCreate: [],
      toDelete: [],
    });
    mockedStepManager.updateStep.mockResolvedValueOnce(revisedSteps[0]);

    //do test
    const recipe = RecipeManager._updateRecipeSteps(
      currentSteps,
      revisedSteps,
      1,
    );

    expect(mockedStepManager.updateStep).toHaveBeenCalledWith(revisedSteps[0]);
    expect(mockedStepManager.updateStep).toHaveBeenCalledTimes(1);

  });


});

