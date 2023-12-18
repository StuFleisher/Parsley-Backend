"use strict";

/** Database setup for parsley. */

// import { PrismaClient } from '@prisma/client'

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export {};
import type {PrismaClient} from '@prisma/client'
/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
*/
const {mockDeep} = require('jest-mock-extended');
const {PrismaClient:PrismaClientClass} = require('@prisma/client')


let prisma:PrismaClient;
if (process.env.NODE_ENV==='test'){
  // const {PrismaClient} = require('@prisma/client');
  const mockPrisma = mockDeep() as unknown as PrismaClient;
  prisma = mockPrisma;
  console.log("Loading mocked prisma for testing")
} else {
  prisma = new PrismaClientClass();
  console.log("loading prisma instance")
}

function getPrismaClient():PrismaClient{
  // if (!prisma){
  //   prisma = new PrismaClientClass();
  // }
  return prisma
}

module.exports = getPrismaClient;
