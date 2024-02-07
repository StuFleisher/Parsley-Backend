import '../config'; //this loads the env variables
import { BadRequestError } from '../utils/expressError';
import {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  userSubmittedRecipe1,
  generatedRecipe1,
} from '../test/test_common';

import { jest } from '@jest/globals';

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

import OpenAI from 'openai';
import { textToRecipe } from './openai';
import { TEST_RECIPE_TEXT } from './prompts';


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