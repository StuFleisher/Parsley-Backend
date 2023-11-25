"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const express = require("express");
// const { ErrorRequestHandler, NextFunction } = require("express");
const cors = require('cors');
const { NotFoundError } = require('./utils/expressError');
const recipesRoutes = require('./routes/recipes');
const app = express();
app.use(cors());
app.use(express.json());
app.use("/recipes", recipesRoutes);
/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
    throw new NotFoundError();
});
/** Generic error handler; anything unhandled goes here. */
const genericErrorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV !== "test")
        console.error(err.stack);
    const status = err.status || 500;
    const message = err.message;
    return res.status(status).json({
        error: { message, status },
    });
};
app.use(genericErrorHandler);
module.exports = app;
