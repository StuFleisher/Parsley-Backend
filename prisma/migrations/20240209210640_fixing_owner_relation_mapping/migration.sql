/*
  Warnings:

  - You are about to drop the column `owner_username` on the `recipes` table. All the data in the column will be lost.
  - Added the required column `owner` to the `recipes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "recipes" DROP CONSTRAINT "recipes_owner_username_fkey";

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "owner_username",
ADD COLUMN     "owner" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_owner_fkey" FOREIGN KEY ("owner") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
