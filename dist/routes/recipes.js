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
    const validator = jsonschema.validate(req.body, recipeNewSchema, { required: true });
    if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs.join(", "));
    }
    const recipe = await RecipeFactory.saveRecipe(req.body);
    return res.status(201).json({ recipe });
});
/** GET /[id] {id} => {recipe}
 *
 * @params id (unique recipeId)
 *
 * @returns recipe: {recipeId, name, description, sourceUrl, sourceName, steps[] }
 *          step: {stepId, stepNumber,instructions, ingredients[] }
 *          ingredient: {ingredientId, amount, description}
 *
 * TODO: add Auth Required: loggedIn
 */
router.get("/:id", async function (req, res, next) {
    const recipe = await RecipeFactory.getRecipeById(+req.params.id);
    return res.json({ recipe });
});
/** GET /
 *  Returns a list of all recipes without submodel data
 *
 * @returns recipes: [{recipeId, name, description, sourceUrl, sourceName},...]
 *
 *
 * TODO: add Auth Required: loggedIn
 */
router.get("/", async function (req, res, next) {
    const recipes = await RecipeFactory.getAllRecipes();
    return res.json({ recipes });
});
module.exports = router;
