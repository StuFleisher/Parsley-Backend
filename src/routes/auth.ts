"use strict";

/** Routes for recipes */


/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };
import { Request, Response, NextFunction } from "express";

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const express = require('express');
const router = express.Router();

const jsonschema = require('jsonschema');
const userAuthSchema = require("../schemas/userAuth.json");
const userRegisterSchema = require("../schemas/userRegister.json");

const { BadRequestError } = require('../utils/expressError');
const { createToken } = require("../utils/tokens");

const UserManager = require('../models/user');


/** POST /auth/token:  { username, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/token", async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const validator = jsonschema.validate(
    req.body,
    userAuthSchema,
    {required: true}
  );
  if (!validator.valid) {
    const errs = validator.errors.map((e:Error)=> e.stack);
    console.log("test")
    throw new BadRequestError(errs);
  }

  const { username, password } = req.body;
  const user = await UserManager.authenticate(username, password);
  const token = createToken(user);
  return res.json({ token });
});


/** POST /auth/register:   { user } => { token }
 *
 * user must include { username, password, firstName, lastName, email }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/register", async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const validator = jsonschema.validate(
    req.body,
    userRegisterSchema,
    {required: true}
  );
  if (!validator.valid) {
    const errs = validator.errors.map((e:Error) => e.stack);
    throw new BadRequestError(errs);
  }

  const newUser = await UserManager.register({ ...req.body, isAdmin: false });
  const token = createToken(newUser);
  return res.status(201).json({ token });
});

module.exports = router;