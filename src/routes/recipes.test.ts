"use strict";


/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };


/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
*/
require('../config'); //this loads the test database

jest.mock("../api/openai",()=>{
  return {
    textToRecipe: jest.fn(),
  }
})
const {textToRecipe} = require("../api/openai");

const request = require('supertest');
const app = require('../app');
const RecipeManager = require('../models/recipe');
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  userSubmittedRecipe1,
  storedRecipe1,
  generatedRecipe1,
} = require('../test/test_common');

const TEST_RECIPE_TEXT = require('../api/prompts');

const { BadRequestError, NotFoundError } = require('../utils/expressError');

beforeAll(commonBeforeAll);
beforeEach(async function () {
  await RecipeManager.saveRecipe(userSubmittedRecipe1);
  commonBeforeEach();
});
afterEach(commonAfterEach);


/************************** GENERATE *********************/
describe("POST /generate", function () {
  beforeEach(()=>{
    textToRecipe.mockClear();
  })

  test("OK", async function () {
    textToRecipe.mockResolvedValue(generatedRecipe1);

    const resp = await request(app)
      .post("/recipes/generate")
      .send(TEST_RECIPE_TEXT);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body.recipe).toEqual(generatedRecipe1);
  });

  test("Returns well formatted error from bad input", async function(){
    textToRecipe.mockImplementation(async ()=>{
      throw new BadRequestError("Error1, Error2");
    });

    const resp = await request(app)
      .post("/recipes/generate")
      .send(TEST_RECIPE_TEXT);

    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      message:"There was an issue processing your recipe",
      errors:"Error1, Error2"
    });
  })
});


/************************** GET ALL **********************/
describe("GET /", function () {
  test("OK", async function () {

    const mockedGetAllRecipes = jest.spyOn(RecipeManager,"getAllRecipes");
    mockedGetAllRecipes.mockReturnValueOnce([{
      recipeId:1,
      name: "R1Name",
      description: "R1Description",
      sourceUrl: "http://R1SourceUrl.com",
      sourceName: "R1SourceName"
    }])

    const resp = await request(app).get("/recipes");

    expect(resp.statusCode).toEqual(200);
    expect(mockedGetAllRecipes).toHaveBeenCalledTimes(1);
    expect(resp.body).toEqual({
      recipes:[{
        recipeId:1,
        name: "R1Name",
        description: "R1Description",
        sourceUrl: "http://R1SourceUrl.com",
        sourceName: "R1SourceName"
      }]
    });
  });
});

/************************** GET BY ID **********************/
describe("GET /{id}", function () {

  const mockedGetRecipeById = jest.spyOn(RecipeManager,"getRecipeById");
  mockedGetRecipeById.mockReturnValueOnce(storedRecipe1)

  test("OK", async function () {
    // const recipe = await RecipeManager.saveRecipe(userSubmittedRecipe1);
    const resp = await request(app).get(`/recipes/1`);

    expect(mockedGetRecipeById).toHaveBeenCalledWith(1);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({recipe:storedRecipe1})

  });

  test("404 for bad ID", async function () {
    const mockedGetRecipeById = jest.spyOn(RecipeManager,"getRecipeById");
    mockedGetRecipeById.mockImplementationOnce(async ()=>{
      throw new NotFoundError()
    })

    const resp = await request(app).get(`/recipes/0`);
    expect(mockedGetRecipeById).toHaveBeenCalledWith(0);
    expect(resp.statusCode).toEqual(404);
  });

});


/************************** POST *************************/
describe("POST /recipes", function () {

  test("OK", async function () {
    const mockedSaveRecipe = jest.spyOn(RecipeManager,"saveRecipe");
    mockedSaveRecipe.mockReturnValueOnce(storedRecipe1)

    const resp = await request(app)
      .post("/recipes")
      .send(userSubmittedRecipe1);

    //response should be OK
    expect(resp.statusCode).toEqual(201);

    //should return correct data
    expect(resp.body).toEqual({recipe:storedRecipe1})
  });

  test("Invalid data should throw BadRequestError", async function () {
    const invalidRecipe = {
      ...userSubmittedRecipe1,
      name: "",
    };
    const resp = await request(app)
      .post("/recipes")
      .send(invalidRecipe);

    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": "instance.name does not meet minimum length of 1",
        "status": 400
      }
    })
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
      .send(invalidRecipe);

    expect(resp.statusCode).toEqual(400);
  });

});

/************************** DELETE *************************/

  describe("DELETE /{id}", function () {

    test("OK", async function () {

      const deleteRecipeByIdMock = jest.spyOn(RecipeManager,"deleteRecipeById");
      deleteRecipeByIdMock.mockReturnValueOnce(storedRecipe1)

      const resp = await request(app).delete(`/recipes/1`);

      expect(deleteRecipeByIdMock).toHaveBeenCalledWith(1)
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({
        deleted: storedRecipe1,
      });
    });

    test("404 for bad ID", async function () {
      const deleteRecipeByIdMock = jest.spyOn(RecipeManager,"deleteRecipeById");
      deleteRecipeByIdMock.mockImplementation( async function (){
        throw new NotFoundError();
      })

      const resp = await request(app).delete(`/recipes/0`);
      expect(resp.statusCode).toEqual(404);
    });

  });

  /************************** PUT *************************/

  describe("PUT /{id}", function () {

    test("OK", async function () {

      const updateRecipeMock = jest.spyOn(RecipeManager,"updateRecipe");
      updateRecipeMock.mockReturnValueOnce(storedRecipe1)

      const resp = await request(app)
        .put(`/recipes/1`)
        .send(storedRecipe1);

      expect(updateRecipeMock).toHaveBeenCalledWith(storedRecipe1)
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({
        recipe: storedRecipe1,
      });
    });

    test("404 for bad ID", async function () {
      const updateRecipeMock = jest.spyOn(RecipeManager,"updateRecipe");
      updateRecipeMock.mockImplementation( async function (){
        throw new NotFoundError();
      })

      const resp = await request(app).delete(`/recipes/0`);
      expect(resp.statusCode).toEqual(404);
    });

  });