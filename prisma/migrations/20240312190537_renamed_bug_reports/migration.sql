/*
  Warnings:

  - You are about to drop the `bug_report` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "bug_report" DROP CONSTRAINT "bug_report_reportedBy_fkey";

-- DropTable
DROP TABLE "bug_report";

-- CreateTable
CREATE TABLE "bug_reports" (
    "reportId" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedBy" TEXT NOT NULL,
    "reportText" TEXT NOT NULL,

    CONSTRAINT "bug_reports_pkey" PRIMARY KEY ("reportId")
);

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
