//The base format for a recipe as provided by the raw-text parser
interface IRecipeBase {
  name:string;
  steps:IStepBase[];
}

//Additional metadata from the user.  Extends IRecipeBase.
interface IRecipeWithMetadata extends IRecipeBase {
  description: string;
  sourceUrl: string|undefined;
  sourceName: string;
}

//A full recipe including system generated values. Extends IRecipeWithMetadata
interface IRecipe extends IRecipeWithMetadata{
  recipeId:number;
}

interface IStepBase {
  stepNumber:number,
  ingredients:IIngredientBase[],
  instructions: string
}

interface IStep extends IStepBase{
  stepId:number
}

interface IIngredientBase {
  amount: string;
  description: string;
}

interface IIngredient extends IIngredientBase {
  ingredientId: number;
}

