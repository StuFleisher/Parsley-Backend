import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'


jest.mock('./prismaClient', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))
import prisma from './prismaClient'

beforeEach(() => {
  mockReset(prismaMock)
})

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>