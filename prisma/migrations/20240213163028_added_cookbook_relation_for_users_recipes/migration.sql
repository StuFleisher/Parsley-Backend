-- CreateTable
CREATE TABLE "cookbooks" (
    "cookbookId" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "recipeId" INTEGER NOT NULL,

    CONSTRAINT "cookbooks_pkey" PRIMARY KEY ("cookbookId")
);

-- AddForeignKey
ALTER TABLE "cookbooks" ADD CONSTRAINT "cookbooks_username_fkey" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cookbooks" ADD CONSTRAINT "cookbooks_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("recipeId") ON DELETE CASCADE ON UPDATE CASCADE;
