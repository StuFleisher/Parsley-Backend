/*
  Warnings:

  - The primary key for the `ingredients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ingredient_id` on the `ingredients` table. All the data in the column will be lost.
  - The primary key for the `recipes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `recipe_id` on the `recipes` table. All the data in the column will be lost.
  - The primary key for the `steps` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `step_id` on the `steps` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_step_fkey";

-- DropForeignKey
ALTER TABLE "steps" DROP CONSTRAINT "steps_recipe_id_fkey";

-- AlterTable
ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_pkey",
DROP COLUMN "ingredient_id",
ADD COLUMN     "ingredientId" SERIAL NOT NULL,
ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("ingredientId");

-- AlterTable
ALTER TABLE "recipes" DROP CONSTRAINT "recipes_pkey",
DROP COLUMN "recipe_id",
ADD COLUMN     "recipeId" SERIAL NOT NULL,
ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("recipeId");

-- AlterTable
ALTER TABLE "steps" DROP CONSTRAINT "steps_pkey",
DROP COLUMN "step_id",
ADD COLUMN     "stepId" SERIAL NOT NULL,
ADD CONSTRAINT "steps_pkey" PRIMARY KEY ("stepId");

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_step_fkey" FOREIGN KEY ("step") REFERENCES "steps"("stepId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "steps" ADD CONSTRAINT "steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipeId") ON DELETE CASCADE ON UPDATE NO ACTION;
