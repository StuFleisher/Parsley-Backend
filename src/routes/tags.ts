import express from 'express';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();
//modules
import RecipeManager from '../models/recipe';

router.get(
  "/:name",
  async function (req: Request, res: Response, next: NextFunction) {
    const recipes = await RecipeManager.getRecipesByTag(req.params.name);
    return res.json({ recipes });
  }
);

export default router;
