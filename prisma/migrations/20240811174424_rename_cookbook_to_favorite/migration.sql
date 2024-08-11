-- AlterTable
ALTER TABLE "favorites" RENAME CONSTRAINT "cookbooks_pkey" TO "favorites_pkey";

-- RenameIndex
ALTER INDEX "cookbooks_recipeId_username_key" RENAME TO "favorites_recipeId_username_key";
