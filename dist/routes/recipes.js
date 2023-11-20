"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const jsonschema = require('jsonschema');
const express = require('express');
const { BadRequestError } = require('../utils/expressError');
const RecipeFactory = require('../models/recipe');
const recipeNewSchema = require("../schemas/recipeNew.json");
const router = express.Router();
/** POST / {recipe} => {recipe}
 *
 * @params recipe: {name, description, sourceUrl, sourceName, steps[] }
 *         step: {stepNumber,instructions, ingredients[] }
 *         ingredient: {amount, description}
 *
 * @returns recipe: {recipeId, name, description, sourceUrl, sourceName, steps[] }
 *          step: {stepId, stepNumber,instructions, ingredients[] }
 *          ingredient: {ingredientId, amount, description}
 *
 * TODO: add Auth Required: loggedIn
 */
router.post("/", async function (req, res, next) {
    console.log("you hit the route");
    const validator = jsonschema.validate(req.body, recipeNewSchema, { required: true });
    if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs.join(", "));
    }
    const recipe = await RecipeFactory.saveRecipe(req.body);
    return res.status(201).json({ recipe });
});
module.exports = router;
