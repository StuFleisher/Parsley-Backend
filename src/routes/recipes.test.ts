import '../config'; //this loads the test database
import { jest } from '@jest/globals';

jest.mock("../api/openai", () => {
  return {
    textToRecipe: jest.fn(),
  };
});
import { textToRecipe as realTextToRecipe } from "../api/openai";
const textToRecipe = realTextToRecipe as jest.MockedFunction<typeof realTextToRecipe>;

// jest.mock('../middleware/auth', ()=>({
//   ensureOwnerOrAdmin:jest.fn()
// }))
// import { ensureOwnerOrAdmin } from '../middleware/auth';


import request from 'supertest';
import app from '../app';
import RecipeManager from '../models/recipe';




import {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  userSubmittedRecipe1,
  storedRecipe1,
  generatedRecipe1,
  u1Token,
  u2Token,
  adminToken,
} from '../test/test_common';

import { TEST_RECIPE_TEXT } from '../api/prompts';

import { BadRequestError, NotFoundError } from '../utils/expressError';

beforeAll(commonBeforeAll);
beforeEach(async function () {
  // await RecipeManager.saveRecipe(userSubmittedRecipe1);
  commonBeforeEach();
});
afterEach(commonAfterEach);


/************************** GENERATE *********************/
describe("POST /generate", function () {

  test("OK", async function () {
    textToRecipe.mockResolvedValue(generatedRecipe1);

    // console.log("test post /generate",TEST_RECIPE_TEXT)
    const resp = await request(app)
      .post("/recipes/generate")
      .send({ recipeText: TEST_RECIPE_TEXT })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body.recipe).toEqual(generatedRecipe1);
  });

  test("Returns well formatted error from bad input", async function () {
    textToRecipe.mockImplementation(async () => {
      throw new BadRequestError("Error1, Error2");
    });

    const resp = await request(app)
      .post("/recipes/generate")
      .send({ recipeText: TEST_RECIPE_TEXT })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      message: "There was an issue processing your recipe",
      errors: "Error1, Error2"
    });
  });
});


/************************** GET ALL **********************/
describe("GET /", function () {
  test("OK", async function () {

    const mockedGetAllRecipes = jest.spyOn(RecipeManager, "getAllRecipes");
    mockedGetAllRecipes.mockResolvedValueOnce([{
      recipeId: 1,
      name: "R1Name",
      description: "R1Description",
      sourceUrl: "http://R1SourceUrl.com",
      sourceName: "R1SourceName",
      imageUrl: "http://R1ImageUrl.com",
      owner: "u1"
    }]);

    const resp = await request(app).get("/recipes");

    expect(resp.statusCode).toEqual(200);
    expect(mockedGetAllRecipes).toHaveBeenCalledTimes(1);
    expect(resp.body).toEqual({
      recipes: [{
        recipeId: 1,
        name: "R1Name",
        description: "R1Description",
        sourceUrl: "http://R1SourceUrl.com",
        sourceName: "R1SourceName",
        imageUrl: "http://R1ImageUrl.com",
        owner: "u1"
      }]
    });
  });
});

/************************** GET BY ID **********************/
describe("GET /{id}", function () {

  const mockedGetRecipeById = jest.spyOn(RecipeManager, "getRecipeById");
  mockedGetRecipeById.mockResolvedValueOnce(storedRecipe1);

  test("OK", async function () {
    // const recipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const resp = await request(app).get(`/recipes/1`);

    expect(mockedGetRecipeById).toHaveBeenCalledWith(1);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ recipe: storedRecipe1 });

  });

  test("404 for bad ID", async function () {
    const mockedGetRecipeById = jest.spyOn(RecipeManager, "getRecipeById");
    mockedGetRecipeById.mockImplementationOnce(async () => {
      throw new NotFoundError();
    });

    const resp = await request(app).get(`/recipes/0`);
    expect(mockedGetRecipeById).toHaveBeenCalledWith(0);
    expect(resp.statusCode).toEqual(404);
  });

});


/************************** POST *************************/
describe("POST /recipes", function () {

  test("OK", async function () {
    const mockedSaveRecipe = jest.spyOn(RecipeManager, "saveRecipe");
    mockedSaveRecipe.mockResolvedValueOnce(storedRecipe1);

    const resp = await request(app)
      .post("/recipes")
      .send(userSubmittedRecipe1)
      .set("authorization", `Bearer ${adminToken}`);

    //should return correct data
    expect(resp.body).toEqual({ recipe: storedRecipe1 });

    //response should be OK
    expect(resp.statusCode).toEqual(201);

  });

  test("Invalid data should throw BadRequestError", async function () {
    const invalidRecipe = {
      ...userSubmittedRecipe1,
      name: "",
    };
    const resp = await request(app)
      .post("/recipes")
      .send(invalidRecipe)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": "instance.name does not meet minimum length of 1",
        "status": 400
      }
    });
  });

  test("Missing data should throw BadRequestError", async function () {
    const invalidRecipe = { //missing steps prop
      name: "R1Name",
      description: "R1Description",
      sourceUrl: "http://R1SourceUrl.com",
      sourceName: "R1SourceName",
    };
    const resp = await request(app)
      .post("/recipes")
      .send(invalidRecipe)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(400);
  });

});

/************************** DELETE *************************/

describe("DELETE /{id}", function () {

  test("OK", async function () {

    //mock for middleware
    const mockedGetRecipeById = jest.spyOn(RecipeManager, "getRecipeById")
    mockedGetRecipeById.mockResolvedValueOnce({owner:"u1"} as RecipeData)

    const deleteRecipeByIdMock = jest.spyOn(RecipeManager, "deleteRecipeById");
    deleteRecipeByIdMock.mockResolvedValueOnce(storedRecipe1);

    const resp = await request(app)
      .delete(`/recipes/1`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(deleteRecipeByIdMock).toHaveBeenCalledWith(1);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      deleted: storedRecipe1,
    });
  });

  test("404 for bad ID", async function () {

    //mock for middleware
    const mockedGetRecipeById = jest.spyOn(RecipeManager, "getRecipeById")
    mockedGetRecipeById.mockResolvedValueOnce({owner:"u1"} as RecipeData)

    //mock for route
    const deleteRecipeByIdMock = jest.spyOn(RecipeManager, "deleteRecipeById");
    deleteRecipeByIdMock.mockImplementation(async function () {
      throw new NotFoundError();
    });

    const resp = await request(app)
      .delete(`/recipes/0`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

});

/************************** PUT *************************/

describe("PUT /{id}", function () {

  test("OK", async function () {

    //mock for middleware
    const mockedGetRecipeById = jest.spyOn(RecipeManager, "getRecipeById")
    mockedGetRecipeById.mockResolvedValueOnce({owner:"u1"} as RecipeData)

    //mock for route
    const updateRecipeMock = jest.spyOn(RecipeManager, "updateRecipe");
    updateRecipeMock.mockResolvedValueOnce(storedRecipe1);

    const resp = await request(app)
      .put(`/recipes/1`)
      .send(storedRecipe1)
      .set("authorization", `Bearer ${adminToken}`);

    expect(updateRecipeMock).toHaveBeenCalledWith(storedRecipe1);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      recipe: storedRecipe1,
    });
  });

  test("404 for bad ID", async function () {
    //mock for middleware
    const mockedGetRecipeById = jest.spyOn(RecipeManager, "getRecipeById")
    mockedGetRecipeById.mockResolvedValueOnce({owner:"u1"} as RecipeData)

    //mock for route
    const updateRecipeMock = jest.spyOn(RecipeManager, "updateRecipe");
    updateRecipeMock.mockImplementation(async function () {
      throw new NotFoundError();
    });

    const resp = await request(app)
      .delete(`/recipes/0`)
      .set("authorization", `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(404);
  });

});


/************************** COOKBOOK ACTIONS *************************/

describe("POST /{id}/addToCookbook", function () {
  const addToCookbookMock = jest.spyOn(RecipeManager, "addToCookbook");

  test("works for user", async function () {
    addToCookbookMock.mockResolvedValueOnce({
      cookbookId: 1,
      recipeId: 1,
      username: "u1",
    });

    const resp = await request(app)
      .post("/recipes/1/addToCookbook")
      .send({ username: "u1" })
      .set("authorization", `Bearer ${u1Token}`);

    expect(addToCookbookMock).toHaveBeenCalledWith(1, "u1");
    expect(addToCookbookMock).toHaveBeenCalledTimes(1);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      created: {
        cookbookId: 1,
        recipeId: 1,
        username: "u1",
      }
    });
  });

  test("works for admin", async function () {
    addToCookbookMock.mockResolvedValueOnce({
      cookbookId: 1,
      recipeId: 1,
      username: "u1",
    });

    const resp = await request(app)
      .post("/recipes/1/addToCookbook")
      .send({ username: "u1" })
      .set("authorization", `Bearer ${adminToken}`);

    expect(addToCookbookMock).toHaveBeenCalledWith(1, "u1");
    expect(addToCookbookMock).toHaveBeenCalledTimes(1);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      created: {
        cookbookId: 1,
        recipeId: 1,
        username: "u1",
      }
    });
  });

  test("401 for wrong user", async function () {
    const resp = await request(app)
      .post("/recipes/1/addToCookbook")
      .send({ username: "u1" })
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test("401 for anon", async function () {
    const resp = await request(app)
      .post("/recipes/1/addToCookbook")
      .send({ username: "u1" });

    expect(resp.statusCode).toEqual(401);
  });

});


describe("POST /{id}/removeFromCookbook", function () {
  const removeFromCookbookMock = jest.spyOn(RecipeManager, "removeFromCookbook");

  test("works for user", async function () {
    removeFromCookbookMock.mockResolvedValueOnce({
      removed: {
        username: "u1",
        recipeId: 1,
      }
    });

    const resp = await request(app)
      .post("/recipes/1/removeFromCookbook")
      .send({ username: "u1" })
      .set("authorization", `Bearer ${u1Token}`);

    expect(removeFromCookbookMock).toHaveBeenCalledWith(1, "u1");
    expect(removeFromCookbookMock).toHaveBeenCalledTimes(1);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      removed: {
        recipeId: 1,
        username: "u1",
      }
    });
  });

  test("works for admin", async function () {
    removeFromCookbookMock.mockResolvedValueOnce({
      removed: {
        username: "u1",
        recipeId: 1,
      }
    });

    const resp = await request(app)
      .post("/recipes/1/removeFromCookbook")
      .send({ username: "u1" })
      .set("authorization", `Bearer ${adminToken}`);

    expect(removeFromCookbookMock).toHaveBeenCalledWith(1, "u1");
    expect(removeFromCookbookMock).toHaveBeenCalledTimes(1);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      removed: {
        recipeId: 1,
        username: "u1",
      }
    });
  });

  test("401 for wrong user", async function () {
    const resp = await request(app)
      .post("/recipes/1/removeFromCookbook")
      .send({ username: "u1" })
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test("401 for anon", async function () {
    const resp = await request(app)
      .post("/recipes/1/removeFromCookbook")
      .send({ username: "u1" });

    expect(resp.statusCode).toEqual(401);
  });


});