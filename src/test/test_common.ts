"use strict"
export {};

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export {};

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */

const getPrismaClient = require('../client');
const prisma = getPrismaClient();
const {DATABASE_URL} = require('../config');
const {execSync} = require('child_process');
const {createToken} = require('../utils/tokens')

//runs any migrations using the test database
async function commonBeforeAll(){
  execSync('npx prisma migrate deploy', { env: process.env });
}

//prints to console to clarify logging within individual tests
async function commonBeforeEach(){
  jest.clearAllMocks();
}

//resets the test database
async function commonAfterEach(){
  const recipeCount = await prisma.recipe.deleteMany({});
}

const userSubmittedRecipe1: IRecipeWithMetadata = {
  name: "R1Name",
  description: "R1Description",
  sourceUrl: "http://R1SourceUrl.com",
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

const storedRecipe1: RecipeData = {
  recipeId:1,
  name: "R1Name",
  description: "R1Description",
  sourceUrl: "http://R1SourceUrl.com",
  sourceName: "R1SourceName",
  steps: [
    {
      recipeId:1,
      stepId:1,
      stepNumber: 1,
      instructions: "R1S1Instructions",
      ingredients: [{
        ingredientId:1,
        step:1,
        amount: "R1S1I1Amount",
        description: "R1S1I1Description"
      }]
    }
  ]
}

const generatedRecipe1: IRecipeBase = {
  name: "R1Name",
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

const userSubmittedRecipe2: IRecipeWithMetadata = {
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

const adminToken = createToken({ username: "admin", isAdmin: true });

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  userSubmittedRecipe1,
  generatedRecipe1,
  userSubmittedRecipe2,
  storedRecipe1,
  adminToken,
}