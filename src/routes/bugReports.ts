import express from 'express';
import { Request, Response, NextFunction } from 'express';
const router = express.Router();


import {
  ensureLoggedIn,
} from '../middleware/auth';
import BugReportManager from "../models/bugReport";

router.post(
  "/",
  ensureLoggedIn,
  async function (req: Request, res: Response, next: NextFunction) {
    //TODO: test

    const bugReport = req.body.bugReport;
    let response;
    try {
      response = await BugReportManager.createBugReport(bugReport);
    } catch (err) {
      return res.status(400).json({
        message: "There was an issue processing your report",
        errors: err.message,
      });
    }
    return res.status(201).json({ bugReport });
  });


  export default router;