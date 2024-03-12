import '../config';
import prisma from '../prismaClient';

type BugReport = {
  reportText: string;
  reportedBy: string;
};

class BugReportManager {

  static async createBugReport({ reportedBy, reportText }: BugReport) {
    const bugReport = await prisma.bugReport.create({
      data: { reportedBy, reportText }
    });
    return bugReport;
  }

}

export default BugReportManager;