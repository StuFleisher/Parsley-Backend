"use strict";

import '../config'; //sets the correct database!
import {commonBeforeAll, commonBeforeEach, commonAfterEach}
  from "../test/test_common";
import prisma from "../client";
import Recipe from "./recipe";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);

const testRecipe1:IRecipeWithMetadata = {
  name: "R1Name",
  description: "R1Description",
  sourceUrl: "R1SourceUrl",
  sourceName: "R1SourceName",
  steps: [
    {
      stepNumber: 1,
      instructions: "R1S1Instructions",
      ingredients: [{
        amount: "R1S1I1Amount",
        description: "R1S1I1Description"
      }]
    }
  ]
};

const testRecipe2:IRecipeWithMetadata = {
  name: "R2Name",
  description: "R2Description",
  sourceUrl: "R2SourceUrl",
  sourceName: "R2SourceName",
  steps: [
    {
      stepNumber: 1,
      instructions: "R2S1Instructions",
      ingredients: [{
        amount: "R2S1I1Amount",
        description: "R2S1I1Description",
      }]
    }
  ]
};


describe("Create Recipe", function () {

  test("Returns the correct Recipe with id", async function () {
    const recipe = await Recipe.saveRecipe(testRecipe1);
    expect(recipe).toHaveProperty("recipeId");
    expect(recipe.name).toEqual("R1Name");
    expect(recipe.description).toEqual("R1Description");
    expect(recipe.sourceUrl).toEqual("R1SourceUrl");
    expect(recipe.sourceName).toEqual("R1SourceName");

    expect(recipe.steps[0].stepNumber).toEqual(1);
    expect(recipe.steps[0].instructions).toEqual("R1S1Instructions");

    expect(recipe.steps[0].ingredients[0].amount)
      .toEqual("R1S1I1Amount");
    expect(recipe.steps[0].ingredients[0].description)
      .toEqual("R1S1I1Description");
  });

  test("Creates a record in the database", async function () {
    const recipe = await Recipe.saveRecipe(testRecipe1);

    const result: IRecipe = await prisma.recipe.findUnique({
      where:{
        recipeId:recipe.recipeId,
      },
      include:{
        steps:{
          include:{
            ingredients:true
          }
        }
      }
    })

    expect(result.name).toEqual(testRecipe1.name);
    expect(result.description).toEqual(testRecipe1.description);
    expect(result.sourceUrl).toEqual(testRecipe1.sourceUrl);
    expect(result.sourceName).toEqual(testRecipe1.sourceName);
  });

});