import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();

import jsonschema from 'jsonschema';
import userNewSchema from "../schemas/userNew.json"
import userUpdateSchema from "../schemas/userUpdate.json"

import { BadRequestError } from '../utils/expressError';
import { createToken } from "../utils/tokens";
import { ensureCorrectUserOrAdmin, ensureAdmin, ensureLoggedIn } from "../middleware/auth";
import UserManager from '../models/user';



/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { userId, username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", ensureAdmin, async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const validator = jsonschema.validate(
    req.body,
    userNewSchema,
    { required: true },
  );
  if (!validator.valid) {
    const errs = validator.errors.map((e: Error) => e.stack);
    throw new BadRequestError(errs.join(", "));
  }

  const user = await UserManager.register(req.body);
  const token = createToken(user);
  return res.status(201).json({ user, token });
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", ensureAdmin, async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const users = await UserManager.findAll();
  return res.json({ users });
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin, jobs }
 *   where jobs is { id, title, companyHandle, companyName, state }
 *
 * Authorization required: admin or same user-as-:username
 **/

router.get("/:username", ensureCorrectUserOrAdmin, async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = await UserManager.getUser(req.params.username);
  return res.json({ user });
});

/** GET /[username]/verify => { user }
 *
 * Returns true if the user exists or false if not.
 *
 * Authorization required: none
 **/
  //TODO: TESTING

router.get("/:username/verify", async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isUser = await UserManager.verifyUser(req.params.username);
  return res.json({ isUser });
});


/** GET /[username]/cookbook => { cookbook:SimpleRecipeData[] }
 *
 * Returns a list of SimpleRecipeData records:
 * {cookbook:[]}
 *
 * Authorization required: none
 **/

router.get("/:username/cookbook", async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cookbook = await UserManager.getUserCookbook(req.params.username);
  return res.json({ cookbook });
});

/** GET /[username]/recipes => { recipes:SimpleRecipeData[] }
 *
 * Returns a list of SimpleRecipeData records:
 * {recipes:[]}
 *
 * Authorization required: none
 **/
  //TODO: TESTING

router.get("/:username/recipes", async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const recipes = await UserManager.getUserRecipes(req.params.username);
  return res.json({ recipes });
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.patch("/:username", ensureCorrectUserOrAdmin, async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const validator = jsonschema.validate(
    req.body,
    userUpdateSchema,
    { required: true },
  );
  if (!validator.valid) {
    const errs = validator.errors.map((e:Error) => e.stack);
    throw new BadRequestError(errs.join(", "));
  }

  const user = await UserManager.updateUser(req.params.username, req.body);
  return res.json({ user });
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.delete("/:username", ensureCorrectUserOrAdmin, async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const deletedUser = await UserManager.deleteUser(req.params.username);
  return res.json({ deleted: deletedUser });
});

export default router;