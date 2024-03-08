/*
  Warnings:

  - You are about to drop the `GenerationRequests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "GenerationRequests";

-- CreateTable
CREATE TABLE "generation_request" (
    "requestId" SERIAL NOT NULL,
    "requestText" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "didRetry" BOOLEAN NOT NULL,
    "success" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedBy" TEXT NOT NULL,

    CONSTRAINT "generation_request_pkey" PRIMARY KEY ("requestId")
);

-- AddForeignKey
ALTER TABLE "generation_request" ADD CONSTRAINT "generation_request_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
