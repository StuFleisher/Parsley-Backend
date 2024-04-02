"use strict"

export {};
import { Request, Response, NextFunction } from "express";
import { SECRET_KEY } from "../config";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../utils/expressError";
import RecipeManager from "../models/recipe";




/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers?.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^[Bb]earer /, "").trim();

    try {
      res.locals.user = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      /* ignore invalid tokens (but don't store user!) */
    }
  }
  return next();
}

/** Middleware to use when user must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req: Request, res: Response, next: NextFunction) {
  if (res.locals.user?.username) return next();
  throw new UnauthorizedError();
}


/** Middleware to use when user must be logged in as an admin user.
 *
 *  If not, raises Unauthorized.
 */

function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (res.locals.user?.username && res.locals.user?.isAdmin === true) {
    return next();
  }

  throw new UnauthorizedError();

}

/** Middleware to use when user must provide a valid token & be user matching
 *  username provided as route param.
 *
 *  If not, raises Unauthorized.
 */

function ensureCorrectUserOrAdmin(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;
  const username = res.locals.user?.username;
  if (username && (username === req.params.username || user.isAdmin === true)) {
    return next();
  }

  console.log("unauth")
  throw new UnauthorizedError();
}

/** Middleware to use when user must provide a valid token & be user matching
 *  username property within the request body.
 *
 *  If not, raises Unauthorized.
 */
function ensureMatchingUsernameOrAdmin(
  req: Request, res: Response, next: NextFunction
){
  const user = res.locals.user;
  const username = res.locals.user?.username;
  if (username && (username === req.body.username || user.isAdmin === true)) {
    return next();
  }

  console.log("unauth")
  throw new UnauthorizedError();
}

/** Middleware to use when user must provide a valid token & be user matching
 *  the owner property within the request body.
 *
 *  Use this when you can't access the recipe record directly
 *  (perhaps because it doesn't exist yet)
 *
 *  If not, raises Unauthorized.
 */
function ensureMatchingOwnerOrAdmin(
  req: Request, res: Response, next: NextFunction
){
  const user = res.locals.user;
  const username = res.locals.user?.username;
  if (username && (username === req.body.owner || user.isAdmin === true)) {
    return next();
  }

  console.log("unauth")
  throw new UnauthorizedError();
}

/** Middleware to use when they must provide a valid token & be the registered
 * owner of the recipe found in the url params.
 *
 *  If not, raises Unauthorized.
 */
async function ensureOwnerOrAdmin(
  req: Request, res: Response, next: NextFunction
){
  const user = res.locals.user;
  const username = res.locals.user?.username;
  const recipe=await RecipeManager.getRecipeById(+req.params.id)
  if (username && (username === recipe.owner || user.isAdmin === true)) {
    return next();
  }

  console.log("unauth")
  throw new UnauthorizedError();
}


export {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin,
  ensureMatchingUsernameOrAdmin,
  ensureMatchingOwnerOrAdmin,
  ensureOwnerOrAdmin,
};