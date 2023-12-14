"use strict";

import { text } from "stream/consumers";


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
const RecipeFactory = require('../models/recipe');
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  userSubmittedRecipe1,
  generatedRecipe1,
} = require('../test/test_common');
const TEST_RECIPE_TEXT = require('../api/prompts');
const {BadRequestError} = require('../utils/expressError');


beforeAll(commonBeforeAll);
beforeEach(async function () {
  await RecipeFactory.saveRecipe(userSubmittedRecipe1);
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
    const resp = await request(app).get("/recipes");

    expect(resp.statusCode).toEqual(200);
    expect(resp.body.recipes[0].name).toEqual("R1Name");
    expect(resp.body.recipes[0].description).toEqual("R1Description");
    expect(resp.body.recipes[0].sourceName).toEqual("R1SourceName");
    expect(resp.body.recipes[0].sourceUrl).toEqual("http://R1SourceUrl.com");
  });
});

/************************** GET BY ID **********************/
describe("GET /{id}", function () {

  test("OK", async function () {
    const recipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
    const resp = await request(app).get(`/recipes/${recipe.recipeId}`);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      recipe: {
        ...userSubmittedRecipe1,
        recipeId: recipe.recipeId,
        steps: [
          {
            ...userSubmittedRecipe1.steps[0],
            stepId: recipe.steps[0].stepId,
            recipeId: recipe.recipeId,
            ingredients: [
              {
                ...userSubmittedRecipe1.steps[0].ingredients[0],
                ingredientId: recipe.steps[0].ingredients[0].ingredientId,
                step: recipe.steps[0].stepId
              }
            ]
          }
        ]
      }
    });
  });

  test("404 for bad ID", async function () {
    const resp = await request(app).get(`/recipes/0`);
    expect(resp.statusCode).toEqual(404);
  });

});


/************************** POST *************************/
describe("POST /recipes", function () {

  test("OK", async function () {
    const resp = await request(app)
      .post("/recipes")
      .send(userSubmittedRecipe1);

    //response should be OK
    expect(resp.statusCode).toEqual(201);

    //should generate ids
    expect(resp.body.recipe).toHaveProperty("recipeId");
    expect(resp.body.recipe.steps[0]).toHaveProperty("stepId");
    expect(resp.body.recipe.steps[0].ingredients[0]).toHaveProperty("ingredientId");

    //should return correct data
    expect(resp.body.recipe.name).toEqual("R1Name");
    expect(resp.body.recipe.description).toEqual("R1Description");
    expect(resp.body.recipe.sourceUrl).toEqual("http://R1SourceUrl.com");
    expect(resp.body.recipe.sourceName).toEqual("R1SourceName");
    expect(resp.body.recipe.steps[0].stepNumber).toEqual(1);
    expect(resp.body.recipe.steps[0].instructions).toEqual("R1S1Instructions");
    expect(resp.body.recipe.steps[0].ingredients[0].amount)
      .toEqual("R1S1I1Amount");
    expect(resp.body.recipe.steps[0].ingredients[0].description)
      .toEqual("R1S1I1Description");
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

/************************** DELETE *************************/

  describe("DELETE /{id}", function () {

    test("OK", async function () {
      const recipe = await RecipeFactory.saveRecipe(userSubmittedRecipe1);
      const resp = await request(app).delete(`/recipes/${recipe.recipeId}`);

      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toEqual({
        deleted: {
          ...userSubmittedRecipe1,
          recipeId: recipe.recipeId,
          steps: [
            {
              ...userSubmittedRecipe1.steps[0],
              stepId: recipe.steps[0].stepId,
              recipeId: recipe.recipeId,
              ingredients: [
                {
                  ...userSubmittedRecipe1.steps[0].ingredients[0],
                  ingredientId: recipe.steps[0].ingredients[0].ingredientId,
                  step: recipe.steps[0].stepId
                }
              ]
            }
          ]
        }
      });
    });

    test("404 for bad ID", async function () {
      const resp = await request(app).delete(`/recipes/0`);
      expect(resp.statusCode).toEqual(404);
    });

  });


});
