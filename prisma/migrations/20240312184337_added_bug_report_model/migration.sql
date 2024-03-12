-- CreateTable
CREATE TABLE "bug_report" (
    "reportId" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedBy" TEXT NOT NULL,
    "reportText" TEXT NOT NULL,

    CONSTRAINT "bug_report_pkey" PRIMARY KEY ("reportId")
);

-- AddForeignKey
ALTER TABLE "bug_report" ADD CONSTRAINT "bug_report_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
