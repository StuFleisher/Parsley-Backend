"use strict"

//load modules
import express, { ErrorRequestHandler, NextFunction } from "express";
import cors from "cors";
import { NotFoundError } from './utils/expressError.js';
import recipesRoutes from "./routes/recipes.js"

const app=express();

app.use(cors());
app.use(express.json());

app.use("/recipes", recipesRoutes);




/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  console.log("hittin the old 404")
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

export default app;
