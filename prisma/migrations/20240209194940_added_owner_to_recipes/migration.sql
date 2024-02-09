/*
  Warnings:

  - You are about to drop the column `ownerId` on the `recipes` table. All the data in the column will be lost.
  - Added the required column `owner_username` to the `recipes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "recipes" DROP CONSTRAINT "recipes_ownerId_fkey";

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "ownerId",
ADD COLUMN     "owner_username" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_owner_username_fkey" FOREIGN KEY ("owner_username") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
