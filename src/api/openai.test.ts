import '../config'; //this loads the env variables
import { BadRequestError } from '../utils/expressError';
import {
  generatedRecipe1,
} from '../test/test_common';

import { jest } from '@jest/globals';

const mockCreate:any = jest.fn().mockImplementation(
  async ():Promise<string> => { return "recipe text"; }
);

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

import { textToRecipe } from './openai';
import { TEST_RECIPE_TEXT } from './prompts';
import OpenAI from 'openai';


describe("Tests for openai", function () {

  beforeEach(() => {
    mockCreate.mockClear();
  });

  test("Works with valid input", async function () {

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(generatedRecipe1) } }]
    });
    const recipe = await textToRecipe(TEST_RECIPE_TEXT, "u1");
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(recipe).toEqual(generatedRecipe1);
  });

  test("Errors for invalid inputs", async function () {
    try {
      await textToRecipe("", "u1");
      throw new Error("Fail test. You shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }

  });

});