import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import type { JwtPayload } from "jsonwebtoken";

// create Issue
const createIssue = async (req: Request, res: Response) => {
  try {
    // console.log("controler" ,req.user);
    const result = await issuesService.createIssueIntoDB(
      req.body,
      req.user as JwtPayload,
    );

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

// get issue
const getIssues = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.getAllIssuesFromDB();

    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const issuesController = {
  createIssue,
  getIssues,
};
