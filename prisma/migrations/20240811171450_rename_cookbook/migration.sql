/*
  Warnings:

  - You are about to drop the `cookbooks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cookbooks" DROP CONSTRAINT "cookbooks_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "cookbooks" DROP CONSTRAINT "cookbooks_username_fkey";

-- RenameTable
ALTER TABLE "cookbooks" RENAME TO "favorites";

-- Rename the Primary Key Column
ALTER TABLE "favorites" RENAME COLUMN "cookbookId" TO "favoriteId";

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_username_fkey" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("recipeId") ON DELETE CASCADE ON UPDATE CASCADE;
