"use strict";

import { describe } from "node:test";

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
require('../config'); //this loads the test database
const getPrismaClient = require('../client');
const prisma = getPrismaClient();
const IngredientManager = require('./ingredient')
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
} = require('../test/test_common');
const { NotFoundError } = require('../utils/expressError');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);

//*************************** CREATE ******************************************/
describe("Tests for createIngredient", function (){

  //Works
  test("Creates Ingredient", async function(){

    prisma.ingredient.create.mockReturnValueOnce({
      ingredientId:1,
      step:1,
      amount:"testAmount",
      description:"testDescription"
    })
    const ingredient = await IngredientManager.createIngredient(
      "testAmount",
      "testDescription",
      1
    )

    expect(prisma.ingredient.create).toHaveBeenCalledWith({
        data: {
          amount:"testAmount",
          description:"testDescription",
          step: 1,
        }
    })
    expect(ingredient).toEqual({
      ingredientId:1,
      step:1,
      amount:"testAmount",
      description:"testDescription"
    });

  })
})

//*************************** UPDATE ******************************************/
describe("Tests for updateIngredient", function (){

  //Works
  test("Updates Ingredient", async function(){

    const ingredientUpdateData = {
      ingredientId:1,
      step:1,
      amount:"testAmount",
      description:"testDescription"
    }

    prisma.ingredient.update.mockReturnValueOnce(ingredientUpdateData)
    const ingredient = await IngredientManager.updateIngredient(
      "testAmount",
      "testDescription",
      1
    )

    expect(prisma.ingredient.create).toHaveBeenCalledWith({
        data: {
          amount:"testAmount",
          description:"testDescription",
          step: 1,
        }
    })
    expect(ingredient).toEqual({
      ingredientId:1,
      step:1,
      amount:"testAmount",
      description:"testDescription"
    });

  })
})
//*************************** DELETE ******************************************/



//**************************SORT INGREDIENTS ******************************** */

describe("Tests for sortIngredients", function () {
  //sorts toDelete correctly
  test("Sorts toDelete correctly", async function () {
    const currentIngredients = [{
      ingredientId: 1,
      amount: "testAmount",
      description: "testDescription"
    }];
    const newIngredients: IIngredientForUpdate[] = [];

    const result = IngredientManager.sortIngredients(currentIngredients, newIngredients);

    expect(result).toEqual({
      toDelete: currentIngredients,
      toUpdate: [],
      toCreate: [],
    });
  });

  //sorts toUpdate correctly
  test("Sorts toUpdate correctly", async function () {
    const currentIngredients = [{
      ingredientId: 1,
      amount: "testAmount",
      description: "testDescription"
    }];
    const newIngredients: IIngredientForUpdate[] = [{
      ingredientId: 1,
      amount: "newAmount",
      description: "newDescription"
    }];

    const result = IngredientManager.sortIngredients(currentIngredients, newIngredients);

    expect(result).toEqual({
      toDelete: [],
      toUpdate: newIngredients,
      toCreate: [],
    });
  });

  //sorts toCreate correctly
  test("Sorts toCreate correctly", async function () {
    const currentIngredients: IIngredient[] = [];
    const newIngredients: IIngredientForUpdate[] = [{
      amount: "newAmount",
      description: "newDescription"
    }];

    const result = IngredientManager.sortIngredients(currentIngredients, newIngredients);

    expect(result).toEqual({
      toDelete: [],
      toUpdate: [],
      toCreate: newIngredients,
    });
  });
});