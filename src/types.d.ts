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
type RecipeData = IRecipeWithMetadata & {
  recipeId:number;
  steps:IStep[];
}

//A less detailed recipe for summary views with no submodel data
type SimpleRecipeData = {
  recipeId:number;
  name:string;
  description: string;
  sourceUrl: string|undefined;
  sourceName: string;
}

interface IStepBase {
  stepNumber:number,
  ingredients:IIngredientBase[],
  instructions: string
}

interface IStep extends IStepBase{
  stepId:number,
  ingredients:IIngredient[]
}

interface IIngredientBase {
  amount: string;
  description: string;
}

interface IIngredient extends IIngredientBase {
  ingredientId: number;
}

