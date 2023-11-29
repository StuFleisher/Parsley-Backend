"use strict";

export { };
require('../config'); //this loads the env variables
const { BadRequestError } = require('../utils/expressError');
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  userSubmittedRecipe1,
  generatedRecipe1,
} = require('../test/test_common');

const mockCreate = jest.fn().mockImplementation(async () => { return "recipe text"; });
jest.mock('openai', () => { // moduleFactory function
  return jest.fn().mockImplementation(() => {      // returns a constructor
    return {                // this is our mocked constructor
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
  });
});
const OpenAI = require('openai');
const { textToRecipe } = require('./openai');
const { TEST_RECIPE_TEXT } = require('./prompts');

describe("Tests for openai", function () {

  beforeEach(() => {
    mockCreate.mockClear();
  });

  test("Works with valid input", async function () {

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(generatedRecipe1) } }]
    });
    const recipe = await textToRecipe(TEST_RECIPE_TEXT);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(recipe).toEqual(generatedRecipe1);
  });

  test("Errors for invalid inputs", async function () {
    try {
      await textToRecipe("");
      throw new Error("Fail test. You shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }

  });

});