import '../config';
import prisma from '../prismaClient';

type BugReport = {
  reportText: string;
  reportedBy: string;
};

/** Manages database model for user filed bug reports */

class BugReportManager {

  /** Takes a BugReport object and creates the associated record in the database
   *
   * @param {reportText:string, reportedBy:string}
   * @returns {
   *     reportId: number;
   *     timestamp: Date;
   *     reportedBy: string;
   *     reportText: string;
   * }
  */

  static async createBugReport({ reportedBy, reportText }: BugReport) {
    const bugReport = await prisma.bugReport.create({
      data: { reportedBy, reportText }
    });
    return bugReport;
  }

}

export default BugReportManager;