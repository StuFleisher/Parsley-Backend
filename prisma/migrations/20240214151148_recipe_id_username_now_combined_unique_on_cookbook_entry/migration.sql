/*
  Warnings:

  - A unique constraint covering the columns `[recipeId,username]` on the table `cookbooks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cookbooks_recipeId_username_key" ON "cookbooks"("recipeId", "username");
