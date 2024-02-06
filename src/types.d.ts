//The base format for a recipe as provided by the raw-text parser
interface IRecipeBase {
  name:string;
  steps:IStepBase[] | IStep[] | IStepForCreate[];
}

//Additional metadata from the user.  Extends IRecipeBase.
interface IRecipeWithMetadata extends IRecipeBase {
  description: string;
  sourceUrl: string|undefined;
  sourceName: string;
  imageUrl: string;
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
  imageUrl: string;
}

interface IStepForCreate {
  recipeId?:number,
  stepNumber:number,
  ingredients:IIngredientBase[],
  instructions: string
}

interface IStepBase {
  recipeId: number,
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
  instructionRef: string;
}

interface IIngredient extends IIngredientBase {
  ingredientId: number;
  step: number;
  instructionRef: string;
}

interface IIngredientForUpdate extends IIngredientBase {
  ingredientId?: number;
}

type IngredientForCreate = {
  step: number;
  amount: string;
  description:string;
  instructionRef:string;
}

interface IUserBase {
  userId?:number,
  username: string,
  password:string,
  firstName:string,
  lastName:string,
  email:string,
  isAdmin:boolean;
}