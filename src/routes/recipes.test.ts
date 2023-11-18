"use strict";

import request from "supertest";
import app from "../app.js";

import RecipeFactory from "../models/recipe.js";
import {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  testRecipe1,
  testRecipe2,
} from "../test/test_common.js";
import { NotFoundError } from '../utils/expressError.js';


beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);


/************************** POST *************************/
describe("POST /recipes", function () {

  test("OK", async function () {
    const resp = await request(app)
      .post("/recipes")
      .send(testRecipe1);

    //response should be OK
    expect(resp.statusCode).toEqual(201);

    //should generate ids
    expect(resp.body).toHaveProperty("recipeId");
    expect(resp.body.steps[0]).toHaveProperty("stepId");
    expect(resp.body.steps[0].ingredients[0]).toHaveProperty("ingredientId");

    //should return correct data
    expect(resp.body.name).toEqual("R1Name");
    expect(resp.body.description).toEqual("R1Description");
    expect(resp.body.sourceUrl).toEqual("http://R1SourceUrl.com");
    expect(resp.body.sourceName).toEqual("R1SourceName");
    expect(resp.body.steps[0].stepNumber).toEqual(1);
    expect(resp.body.steps[0].instructions).toEqual("R1S1Instructions");
    expect(resp.body.steps[0].ingredients[0].amount)
      .toEqual("R1S1I1Amount");
    expect(resp.body.steps[0].ingredients[0].description)
      .toEqual("R1S1I1Description");
  });

  test("Invalid data should throw BadRequestError", async function () {
    const invalidRecipe = {
      ...testRecipe1,
      name:"",
    }
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
    }
    const resp = await request(app)
      .post("/recipes")
      .send(invalidRecipe);

    expect(resp.statusCode).toEqual(400);
  });

});