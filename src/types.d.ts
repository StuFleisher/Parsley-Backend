//The base format for a recipe as provided by the raw-text parser
interface IRecipeBase {
  name:string;
  steps:IStepBase[] | Step[] | StepForCreate[];
  tags: Tag[]
}

//Additional metadata from the user.  Extends IRecipeBase.
interface IRecipeWithMetadata extends IRecipeBase {
  description: string;
  sourceUrl: string;
  sourceName: string;
  imageSm: string;
  imageMd: string;
  imageLg: string;
  owner: string;
}

type GeneratedRecipe = {
  name: string;
  description:string;
  sourceName:string;
  steps: IStep[];
  imageSm: string;
  imageMd: string;
  imageLg: string;
  tags: Tag[];
}

type RecipeForCreate = {
  name:string;
  steps:StepForNewRecipe[];
  description: string;
  sourceUrl: string;
  sourceName: string;
  imageSm: string;
  imageMd: string;
  imageLg: string;
  owner: string;
  tags: Tag[];
}

//Recipe with an Id, but new steps/ingredients may have been created without ids
interface IRecipeForUpdate extends IRecipeWithMetadata {
  recipeId:number;
  steps:StepForUpdate[];
}

//A full recipe including system generated values. Extends IRecipeWithMetadata
interface RecipeData extends IRecipeWithMetadata {
  recipeId:number;
  createdTime: Date;
  steps:Step[];
}


//A less detailed recipe for summary views with no submodel data
type SimpleRecipeData = {
  recipeId:number;
  name:string;
  description: string;
  sourceUrl: string;
  sourceName: string;
  imageSm: string;
  imageMd: string;
  imageLg: string;
  owner: string;
  tags: Tag[]
}

interface IStepBase {
  recipeId: number,
  stepNumber:number,
  ingredients:IIngredientBase[],
  instructions: string
}

type Step = IStepBase & {
  stepId:number,
  ingredients:IIngredient[]
}

type StepForNewRecipe = { //create steps without a recipeId
  stepNumber:number,
  instructions: string,
  ingredients: IngredientForNewRecipe[],
}

type StepForCreate = { //create steps once you have a recipeId
  recipeId: number,
  stepNumber:number,
  instructions: string,
  ingredients: IngredientForCreate[] | IngredientForNewRecipe[],
}

type StepForUpdate = IStepBase & {
  stepId:number;
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

type IngredientForNewRecipe = {
  amount: string;
  description:string;
  instructionRef:string;
}

interface IUserBase {
  userId?:number,
  username: string,
  password?:string,
  firstName:string,
  lastName:string,
  email:string,
  isAdmin:boolean;
}

type Token = {
  username:string;
  isAdmin:boolean;
}

type Tag = {
  name: string;
}