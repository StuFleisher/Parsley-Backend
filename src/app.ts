
import express, { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import cors from 'cors';
import { NotFoundError } from './utils/expressError';
import { authenticateJWT } from "./middleware/auth";
import {MulterError} from "multer";

import authRoutes from './routes/auth';
import recipesRoutes from './routes/recipes';
import usersRoutes from './routes/users';

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


/** Generic error handler; anything unhandled goes here. */
const genericErrorHandler:ErrorRequestHandler = (err,req,res,next) =>{
  if (process.env.NODE_ENV !== "test") console.error(err.stack);

  let status = err.status || 500;
  const message = err.message;

  if (err instanceof MulterError) status=400

  return res.status(status).json({
    error: { message, status },
  });
}
app.use(genericErrorHandler);

export default app;
