"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const request = require('supertest');
const app = require('../app');
const RecipeFactory = require('../models/recipe');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, testRecipe1, testRecipe2 } = require('../test/test_common');
const { NotFoundError } = require('../utils/expressError');
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
        console.log("****ID:", resp.body.recipe.recipeId);
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
            ...testRecipe1,
            name: "",
        };
        const resp = await request(app)
            .post("/recipes")
            .send(invalidRecipe);
        expect(resp.statusCode).toEqual(400);
    });
    test("Missing data should throw BadRequestError", async function () {
        const invalidRecipe = {
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
