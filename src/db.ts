"use strict";

/** Database setup for parsley. */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

//TODO: create logic to build & connect a testing database


export default prisma;
// module.exports = db;