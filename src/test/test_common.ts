"use strict"
export {};
// import prisma from '../client';
// import { DATABASE_URL } from '../config.js';
// import { execSync } from 'child_process';

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export {};

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */

const prisma = require('../client');
const {DATABASE_URL} = require('../config');
const {execSync} = require('child_process');

console.log("DB from recipes.test.ts", DATABASE_URL);

//runs any migrations using the test database
async function commonBeforeAll(){
  execSync('npx prisma migrate deploy', { env: process.env });
}

//prints to console to clarify logging within individual tests
async function commonBeforeEach(){
}

//resets the test database
async function commonAfterEach(){
  const recipeCount = await prisma.recipe.deleteMany({});
  console.log(`Deleted ${recipeCount.count} recipes`)
}

const testRecipe1: IRecipeWithMetadata = {
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

const testRecipe2: IRecipeWithMetadata = {
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


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  testRecipe1,
  testRecipe2,
}