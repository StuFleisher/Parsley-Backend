-- CreateTable
CREATE TABLE "GenerationRequests" (
    "requestId" SERIAL NOT NULL,
    "requestText" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "didRetry" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationRequests_pkey" PRIMARY KEY ("requestId")
);
