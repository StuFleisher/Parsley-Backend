//The base format for a recipe as provided by the raw-text parser
interface IRecipeBase {
  name:string;
  steps:IStep[];
}

//Additional metadata from the user.  Extends IRecipeBase.
interface IRecipeWithMetadata extends IRecipeBase {
  description: string;
  source_url: string|undefined;
  source_name: string;
}

//A full recipe including system generated values. Extends IRecipeWithMetadata
interface IRecipe extends IRecipeWithMetadata{
  id:number;
}

interface IStepBase {
  step_number:number,
  ingredients:IIngredient[],
  instructions: string
}

interface IStep extends IStepBase{
  id:number
}

interface IIngredientBase {
  amount: string;
  description: string;
}

interface IIngredient extends IIngredientBase {
  id: number;
}

