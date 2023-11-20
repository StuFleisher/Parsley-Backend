"use strict";
/** Database setup for parsley. */

// import { PrismaClient } from '@prisma/client'

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export {};

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient()

module.exports = prisma;
