/*
  Warnings:

  - You are about to drop the column `image_url` on the `recipes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "image_url",
ADD COLUMN     "image_lg" TEXT NOT NULL DEFAULT 'https://sf-parsley.s3.amazonaws.com/recipeImage/default-lg',
ADD COLUMN     "image_md" TEXT NOT NULL DEFAULT 'https://sf-parsley.s3.amazonaws.com/recipeImage/default-md',
ADD COLUMN     "image_sm" TEXT NOT NULL DEFAULT 'https://sf-parsley.s3.amazonaws.com/recipeImage/default-sm';
