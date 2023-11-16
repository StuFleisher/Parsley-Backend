"use strict"

import prisma from '../client';
import { DATABASE_URL } from '../config';
import { execSync } from 'child_process';

console.log("DB from recipes.test.ts", DATABASE_URL);

//runs any migrations using the test database
async function commonBeforeAll(){
  execSync('npx prisma migrate deploy', { env: process.env });
}

//prints to console to clarify logging within individual tests
async function commonBeforeEach(){
  console.log("********************************")
}

//resets the test database
async function commonAfterEach(){
  const recipeCount = await prisma.recipe.deleteMany({});
  console.log(`Deleted ${recipeCount.count} recipes`)
}



export {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
}