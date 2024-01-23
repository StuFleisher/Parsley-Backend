/*
  Warnings:

  - Made the column `amount` on table `ingredients` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `recipes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `source_url` on table `recipes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `source_name` on table `recipes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN     "instructionRef" VARCHAR(75) NOT NULL DEFAULT '',
ALTER COLUMN "amount" SET NOT NULL,
ALTER COLUMN "amount" SET DEFAULT '',
ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "recipes" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "source_url" SET NOT NULL,
ALTER COLUMN "source_url" SET DEFAULT '',
ALTER COLUMN "source_name" SET NOT NULL;
