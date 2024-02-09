-- DropForeignKey
ALTER TABLE "recipes" DROP CONSTRAINT "recipes_ownerId_fkey";

-- DropIndex
DROP INDEX "recipes_ownerId_key";

-- AlterTable
ALTER TABLE "recipes" ALTER COLUMN "ownerId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
