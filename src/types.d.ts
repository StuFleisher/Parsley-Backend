//The base format for a recipe as provided by the raw-text parser
interface IRecipeBase {
  name:string;
  steps:IStepBase[] | IStep[];
}

//Additional metadata from the user.  Extends IRecipeBase.
interface IRecipeWithMetadata extends IRecipeBase {
  description: string;
  sourceUrl: string|undefined;
  sourceName: string;
}

//Recipe with an Id, but new steps/ingredients may have been created without ids
interface IRecipeForUpdate extends IRecipeWithMetadata {
  recipeId:number;
  steps:IStepForUpdate[];
}

//A full recipe including system generated values. Extends IRecipeWithMetadata
interface RecipeData extends IRecipeWithMetadata {
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
  recipeId:number,
  ingredients:IIngredient[]
}

interface IStepForUpdate extends IStepBase{
  stepId?:number;
  ingredients:IIngredientForUpdate[]
}

interface IIngredientBase {
  amount: string;
  description: string;
}

interface IIngredient extends IIngredientBase {
  ingredientId: number;
  step: number;
}

interface IIngredientForUpdate extends IIngredientBase {
  ingredientId?: number;
}

