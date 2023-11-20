"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
require('../config');
const prisma = require('../client');
const RecipeFactory = require('./recipe');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, testRecipe1, testRecipe2 } = require('../test/test_common');
const { NotFoundError } = require('../utils/expressError');
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
/********************** CREATE *******************************/
describe("Test Create Recipe", function () {
    test("Returns the correct Recipe with id", async function () {
        const recipe = await RecipeFactory.saveRecipe(testRecipe1);
        expect(recipe).toHaveProperty("recipeId");
        expect(recipe.name).toEqual("R1Name");
        expect(recipe.description).toEqual("R1Description");
        expect(recipe.sourceUrl).toEqual("http://R1SourceUrl.com");
        expect(recipe.sourceName).toEqual("R1SourceName");
    });
    test("Returns with submodel data", async function () {
        const recipe = await RecipeFactory.saveRecipe(testRecipe1);
        expect(recipe.steps[0].stepNumber).toEqual(1);
        expect(recipe.steps[0].instructions).toEqual("R1S1Instructions");
        expect(recipe.steps[0].ingredients[0].amount)
            .toEqual("R1S1I1Amount");
        expect(recipe.steps[0].ingredients[0].description)
            .toEqual("R1S1I1Description");
    });
    test("Creates a record in the database", async function () {
        const recipe = await RecipeFactory.saveRecipe(testRecipe1);
        const result = await prisma.recipe.findUnique({
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
        expect(result.name).toEqual(testRecipe1.name);
        expect(result.description).toEqual(testRecipe1.description);
        expect(result.sourceUrl).toEqual(testRecipe1.sourceUrl);
        expect(result.sourceName).toEqual(testRecipe1.sourceName);
    });
    test("Creates submodel records in the database", async function () {
        const recipe = await RecipeFactory.saveRecipe(testRecipe1);
        const result = await prisma.recipe.findUnique({
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
        const recipe1 = await RecipeFactory.saveRecipe(testRecipe1);
        const recipe2 = await RecipeFactory.saveRecipe(testRecipe2);
        const recipes = await RecipeFactory.getAllRecipes();
        expect(recipes.length).toEqual(2);
    });
    test("Does not return submodel data", async function () {
        const recipe1 = await RecipeFactory.saveRecipe(testRecipe1);
        const recipe2 = await RecipeFactory.saveRecipe(testRecipe2);
        const recipes = await RecipeFactory.getAllRecipes();
        expect(recipes[0]).not.toHaveProperty("steps");
    });
});
/**************** GET BY ID **************************/
describe("Test getRecipeById", function () {
    test("Returns the correct record", async function () {
        const recipe1 = await RecipeFactory.saveRecipe(testRecipe1);
        const result = await RecipeFactory.getRecipeById(recipe1.recipeId);
        expect(result.name).toEqual("R1Name");
        expect(result.description).toEqual("R1Description");
        expect(result.sourceUrl).toEqual("http://R1SourceUrl.com");
        expect(result.sourceName).toEqual("R1SourceName");
    });
    test("Returns submodel data", async function () {
        const recipe1 = await RecipeFactory.saveRecipe(testRecipe1);
        const result = await RecipeFactory.getRecipeById(recipe1.recipeId);
        expect(result.steps[0].stepNumber).toEqual(1);
        expect(result.steps[0].instructions).toEqual("R1S1Instructions");
        expect(result.steps[0].ingredients[0].amount)
            .toEqual("R1S1I1Amount");
        expect(result.steps[0].ingredients[0].description)
            .toEqual("R1S1I1Description");
    });
    test("Throws a NotFound error if record doesn't exist", async function () {
        const recipe1 = await RecipeFactory.saveRecipe(testRecipe1);
        try {
            await RecipeFactory.getRecipeById(0);
            throw new Error("Fail test, you shouldn't get here");
        }
        catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
/**************** UPDATE BY ID **************************/
/**************** DELETE BY ID **************************/
describe("Test deleteRecipeById", function () {
    test("Deletes the correct record", async function () {
        const recipe1 = await RecipeFactory.saveRecipe(testRecipe1);
        const deletedRecipe = await RecipeFactory.deleteRecipeById(recipe1.recipeId);
        expect(deletedRecipe.name).toEqual("R1Name");
        expect(deletedRecipe.description).toEqual("R1Description");
        expect(deletedRecipe.sourceUrl).toEqual("http://R1SourceUrl.com");
        expect(deletedRecipe.sourceName).toEqual("R1SourceName");
        try {
            await RecipeFactory.getRecipeById(recipe1.recipeId);
            throw new Error("Fail test.  You shouldn't get here");
        }
        catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
    test("Deletes submodel data", async function () {
        const recipe1 = await RecipeFactory.saveRecipe(testRecipe1);
        const deletedRecipe = await RecipeFactory.deleteRecipeById(recipe1.recipeId);
        const stepId = deletedRecipe.steps[0].stepId;
        const ingredientId = deletedRecipe.steps[0].ingredients[0].ingredientId;
        expect(await prisma.step.findUnique({
            where: {
                stepId: stepId,
            }
        })).toBe(null);
        expect(await prisma.ingredient.findUnique({
            where: {
                ingredientId: ingredientId,
            }
        })).toBe(null);
    });
    test("Returns the correct record", async function () {
        const recipe1 = await RecipeFactory.saveRecipe(testRecipe1);
        const result = await RecipeFactory.deleteRecipeById(recipe1.recipeId);
        expect(result.name).toEqual("R1Name");
        expect(result.description).toEqual("R1Description");
        expect(result.sourceUrl).toEqual("http://R1SourceUrl.com");
        expect(result.sourceName).toEqual("R1SourceName");
    });
    test("Returns submodel data", async function () {
        const recipe1 = await RecipeFactory.saveRecipe(testRecipe1);
        const result = await RecipeFactory.deleteRecipeById(recipe1.recipeId);
        expect(result.steps[0].stepNumber).toEqual(1);
        expect(result.steps[0].instructions).toEqual("R1S1Instructions");
        expect(result.steps[0].ingredients[0].amount)
            .toEqual("R1S1I1Amount");
        expect(result.steps[0].ingredients[0].description)
            .toEqual("R1S1I1Description");
    });
    test("Throws a NotFound error if record doesn't exist", async function () {
        const recipe1 = await RecipeFactory.saveRecipe(testRecipe1);
        try {
            console.log("attempting to generate error");
            await RecipeFactory.deleteRecipeById(0);
            throw new Error("Fail test, you shouldn't get here");
        }
        catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
/**************** _INTERNAL METHODS **************************/
describe("Test _pojoToPrismaRecipeInput", function () {
    test("Returns correct object", function () {
        expect(RecipeFactory._pojoToPrismaRecipeInput(testRecipe1)).toEqual({
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
