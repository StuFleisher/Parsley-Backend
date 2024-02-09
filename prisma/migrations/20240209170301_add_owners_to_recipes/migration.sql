/*
  Warnings:

  - A unique constraint covering the columns `[ownerId]` on the table `recipes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "ownerId" INTEGER NOT NULL DEFAULT 4;

-- CreateIndex
CREATE UNIQUE INDEX "recipes_ownerId_key" ON "recipes"("ownerId");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
