"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const prisma = require('../client');
const { DATABASE_URL } = require('../config');
const { NotFoundError } = require('../utils/expressError');
console.log("DB from recipes.ts", DATABASE_URL);
/** Data and functionality for recipes */
class RecipeFactory {
    /** Create a recipe from data, store it to the database, then return data
     * from the new record
     *
     * @param: clientRecipe - The recipe data including all metadata and submodels
     * but not including system generated data (like id).
     * @returns: RecipeData (Promise) - Full recipe data including system generated
     * fields
     *  */
    static async saveRecipe(clientRecipe) {
        let recipe = RecipeFactory._pojoToPrismaRecipeInput(clientRecipe);
        return await prisma.recipe.create({
            data: recipe,
            include: {
                steps: {
                    include: {
                        ingredients: true,
                    }
                }
            }
        });
    }
    /** Fetches a list of all recipes from the database. Does not include submodel
     *  data (steps or ingredients)
     *
     * @returns: SimpleRecipeData[] (Promise)
     *  {recipeId, name, description, sourceUrl, sourceName}
     * */
    static async getAllRecipes() {
        let recipes = await prisma.recipe.findMany({});
        return recipes;
    }
    /** Fetches and returns a single recipe record and its submodels from the database
     *  by recipeId.
     *
     * @param: id : number --> The recipeId to query
     * @returns: RecipeData (Promise)
     * {recipeId, name, description, sourceUrl, sourceName, steps}
     *
     * Throws an error if record is not found.
    */
    static async getRecipeById(id) {
        try {
            const recipe = await prisma.recipe.findUniqueOrThrow({
                where: {
                    recipeId: id
                },
                include: {
                    steps: {
                        include: {
                            ingredients: true,
                        }
                    }
                }
            });
            return recipe;
        }
        catch (err) {
            //use our custom error instead
            throw new NotFoundError("Recipe not found");
        }
    }
    //Update
    /** Fetches and deletes a single recipe record and its submodels from the database
     *  by recipeId.  Returns the RecipeData of the deleted record.
     *
     * @param: id : number --> The recipeId to query
     * @returns: RecipeData (Promise)
     * {recipeId, name, description, sourceUrl, sourceName, steps}
     *
     * Throws an error if record is not found.
    */
    static async deleteRecipeById(id) {
        console.log("running deleteRecipeById with id", id);
        try {
            const recipe = await prisma.recipe.delete({
                where: {
                    recipeId: id
                },
                include: {
                    steps: {
                        include: {
                            ingredients: true,
                        }
                    }
                }
            });
            return recipe;
        }
        catch (err) {
            //use our custom error instead
            throw new NotFoundError("Recipe not found");
        }
    }
    /** Accepts an IRecipeWithMetadata object and reshapes it to be appropriate
     * for use in Prisma create commands.  (Submodels will be wrapped in a
     * 'create' property)
     */
    static _pojoToPrismaRecipeInput(recipe) {
        const { steps, ...metadata } = recipe;
        return {
            ...metadata,
            steps: {
                create: steps.map(step => {
                    return {
                        stepNumber: step.stepNumber,
                        instructions: step.instructions,
                        ingredients: {
                            create: step.ingredients.map(ingredient => {
                                return {
                                    amount: ingredient.amount,
                                    description: ingredient.description
                                };
                            })
                        }
                    };
                })
            }
        };
    }
}
module.exports = RecipeFactory;
