import '../config'; //this loads the test database
import {prismaMock as prisma} from '../prismaSingleton';
import IngredientManager from './ingredient';
import {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
} from '../test/test_common';
import { NotFoundError } from '../utils/expressError';


beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);

//*************************** CREATE ******************************************/
describe("Tests for createIngredient", function (){

  //Works
  test("Creates Ingredient", async function(){

    console.log("running test for createIngredient")

    prisma.ingredient.create.mockResolvedValueOnce({
      step:1,
      ingredientId:1,
      amount:"testAmount",
      description:"testDescription",
      instructionRef:"testInstructionRef",
    })
    const ingredient = await IngredientManager.createIngredient({
      step:1,
      amount:"testAmount",
      description:"testDescription",
      instructionRef:"testInstructionRef",
    })

    expect(prisma.ingredient.create).toHaveBeenCalledWith({
        data: {
          step:1,
          amount:"testAmount",
          description:"testDescription",
          instructionRef:"testInstructionRef",
        }
    })
    expect(ingredient).toEqual({
      step:1,
      ingredientId:1,
      amount:"testAmount",
      description:"testDescription",
      instructionRef:"testInstructionRef",
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
      description:"testDescription",
      instructionRef: "testRef"
    }

    prisma.ingredient.update.mockResolvedValueOnce(ingredientUpdateData)
    const ingredient = await IngredientManager.updateIngredient(
      ingredientUpdateData,
      1
    )

    expect(prisma.ingredient.update).toHaveBeenCalledWith({
        data: {
          ingredientId: 1,
          amount:"testAmount",
          description:"testDescription",
          instructionRef: "testRef",
          step: 1,
        },
        where: {ingredientId:1}
    })
    expect(ingredient).toEqual({
      ingredientId:1,
      step:1,
      amount:"testAmount",
      instructionRef: "testRef",
      description:"testDescription"
    });

  })
})
//*************************** DELETE ******************************************/
describe("Test deleteIngredient", function () {

  test("Returns the correct record with submodel data", async function () {

    //mock dependencies
    prisma.ingredient.delete.mockResolvedValueOnce({
      ingredientId:1,
      step:1,
      amount:"testAmount",
      instructionRef: "testRef",
      description:"testDescription"
    });
    //do test
    const result = await IngredientManager.deleteIngredient(1);

    expect(prisma.ingredient.delete).toHaveBeenCalledWith({
      where: { ingredientId: 1 },
    });
    expect(result).toEqual({
      ingredientId:1,
      step:1,
      amount:"testAmount",
      instructionRef: "testRef",
      description:"testDescription"
    });

  });


  test("Throws a NotFound error if record doesn't exist", async function () {
    prisma.ingredient.delete.mockImplementationOnce(() => {
      throw new Error();
    });

    try {
      await IngredientManager.deleteIngredient(0);
      throw new Error("Fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(err.message).toEqual("Ingredient not found");
    }
  });

});


//**************************SORT INGREDIENTS ******************************** */

describe("Tests for sortIngredients", function () {
  //sorts toDelete correctly
  test("Sorts toDelete correctly", async function () {
    const currentIngredients = [{
      step:1,
      ingredientId: 1,
      amount: "testAmount",
      instructionRef: "testRef",
      description: "testDescription"
    }];
    const newIngredients: IIngredientForUpdate[] = [];

    const result = IngredientManager.sortIngredients(
      currentIngredients, newIngredients
    );

    expect(result).toEqual({
      toDelete: currentIngredients,
      toUpdate: [],
      toCreate: [],
    });
  });

  //sorts toUpdate correctly
  test("Sorts toUpdate correctly", async function () {
    const currentIngredients = [{
      step:1,
      ingredientId: 1,
      amount: "testAmount",
      description: "testDescription",
      instructionRef: "testRef"
    }];
    const newIngredients: IIngredientForUpdate[] = [{
      ingredientId: 1,
      amount: "newAmount",
      description: "newDescription",
      instructionRef: "testRef",
    }];

    const result = IngredientManager.sortIngredients(
      currentIngredients, newIngredients
    );

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
      description: "newDescription",
      instructionRef: "testRef",
    }];

    const result = IngredientManager.sortIngredients(
      currentIngredients, newIngredients
    );

    expect(result).toEqual({
      toDelete: [],
      toUpdate: [],
      toCreate: newIngredients,
    });
  });
});