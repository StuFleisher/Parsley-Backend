"use strict"

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export {};
import { ErrorRequestHandler,Request, Response, NextFunction } from "express";
import { MulterError } from "multer";

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const express = require("express");
const cors = require('cors');
const { NotFoundError } = require('./utils/expressError');
const { authenticateJWT } = require("./middleware/auth");

const authRoutes = require('./routes/auth')
const recipesRoutes = require('./routes/recipes')
const usersRoutes = require('./routes/users')

const app=express();

app.use(cors());
app.use(express.json());
app.use(authenticateJWT);


app.use("/auth", authRoutes);
app.use("/recipes", recipesRoutes);
app.use("/users", usersRoutes);




/** Handle 404 errors -- this matches everything */
app.use(function (req:Request, res:Response, next:NextFunction) {
  throw new NotFoundError();
});

/** Handle Multer errors */
const multerErrorHandler:ErrorRequestHandler = (err,req,res,next) =>{
  if (err instanceof MulterError) {
    // A Multer error occurred when uploading.
    if (err.code === 'LIMIT_FILE_SIZE') {
      const status = 400;
      const message = err.message;

      return res.status(400).json(
        {error:{message,status}});
    }
}
}
app.use(multerErrorHandler);

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
