
// import { mockDeep } from 'jest-mock-extended';
import { PrismaClient} from '@prisma/client';


// let prisma:PrismaClient;

// function getPrismaClient():PrismaClient{
//   if (!prisma){
//     if (process.env.NODE_ENV==='test'){
//       // const {PrismaClient} = require('@prisma/client');
//       const mockPrisma = mockDeep<PrismaClient>() ;
//       prisma = mockPrisma;
//       console.log("Loading mocked prisma for testing")
//     } else {
//       prisma = new PrismaClient();
//       console.log("loading prisma instance")
//     }
//   }
//   return prisma
// }

const prisma = new PrismaClient()
export default prisma

// export default getPrismaClient;
