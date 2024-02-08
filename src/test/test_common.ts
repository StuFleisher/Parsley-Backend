import '../config';
import prisma from '../prismaClient';
import { execSync } from 'child_process';
import { createToken } from '../utils/tokens';


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
  imageUrl: "http://R1ImageUrl.com",
  steps: [
    {
      recipeId:1,
      stepNumber: 1,
      instructions: "R1S1Instructions",
      ingredients: [{
        amount: "R1S1I1Amount",
        description: "R1S1I1Description",
        instructionRef:"R1S1I1InstructionRef",
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
  imageUrl: "http://R1ImageUrl.com",
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
        description: "R1S1I1Description",
        instructionRef:"R1S1I1InstructionRef",
      }]
    }
  ]
}

const generatedRecipe1: IRecipeBase = {
  name: "R1Name",
  steps: [
    {
      recipeId:1,
      stepNumber: 1,
      instructions: "R1S1Instructions",
      ingredients: [{
        amount: "R1S1I1Amount",
        description: "R1S1I1Description",
        instructionRef:"R1S1I1InstructionRef",
      }]
    }
  ]
};

const userSubmittedRecipe2: IRecipeWithMetadata = {
  name: "R2Name",
  description: "R2Description",
  sourceUrl: "R2SourceUrl",
  sourceName: "R2SourceName",
  imageUrl: "R2ImageUrl",
  steps: [
    {
      recipeId:2,
      stepNumber: 1,
      instructions: "R2S1Instructions",
      ingredients: [{
        amount: "R2S1I1Amount",
        description: "R2S1I1Description",
        instructionRef:"R2S1I1InstructionRef",
      }]
    }
  ]
};

const user1 = {
  username:"u1",
  isAdmin:false,
  password: "user1password",
  firstName:"U1F",
  lastName:"U1L",
  email:"user1@test.com",
}

const user2 = {
  username:"u2",
  isAdmin:false,
  password: "user2password",
  firstName:"U2F",
  lastName:"U2L",
  email:"user2@test.com",
}

const admin1 = {
  username:"admin1",
  isAdmin:true,
  password: "admin1password",
  firstName:"admin1FirstName",
  lastName:"admin1FirstName",
  email:"admin1@test.com",
}

const u1Token = createToken(user1);
const u2Token = createToken(user2);
const adminToken = createToken(admin1);

export {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  userSubmittedRecipe1,
  generatedRecipe1,
  userSubmittedRecipe2,
  storedRecipe1,
  adminToken,
  u2Token,
  u1Token,
}