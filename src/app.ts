"use strict"
//load modules
// import express, { ErrorRequestHandler, NextFunction } from "express";
// import cors from "cors";
// import { NotFoundError } from './utils/expressError.js';
// import recipesRoutes from "./routes/recipes.js"

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export {};
import { ErrorRequestHandler,Request, Response, NextFunction } from "express";

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const express = require("express");
// const { ErrorRequestHandler, NextFunction } = require("express");
const cors = require('cors');
const { NotFoundError } = require('./utils/expressError');
const recipesRoutes = require('./routes/recipes')

const app=express();

app.use(cors());
app.use(express.json());

app.use("/recipes", recipesRoutes);




/** Handle 404 errors -- this matches everything */
app.use(function (req:Request, res:Response, next:NextFunction) {
  throw new NotFoundError();
});

/** Generic error handler; anything unhandled goes here. */
const genericErrorHandler:ErrorRequestHandler = (err,req,res,next) =>{
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
}
app.use(genericErrorHandler);

module.exports = app;
