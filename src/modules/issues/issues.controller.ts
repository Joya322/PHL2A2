import type { NextFunction, Request, Response } from "express";
import { issuesService } from "./issues.service";
import type { JwtPayload } from "jsonwebtoken";
import type { IssueSort, IssueStatus, IssueType } from "./issues.interface";
import catchAsync from "../../utils/catchAsync";

// create Issue
const createIssue = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await issuesService.createIssueIntoDB(
      req.body,
      req.user as JwtPayload,
    );

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  },
);

// get issues
const getIssues = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sort = req.query.sort as IssueSort | undefined;
    const type = req.query.type as IssueType | undefined;
    const status = req.query.status as IssueStatus | undefined;

    const result = await issuesService.getAllIssuesFromDB(sort, type, status);

    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  },
);

// get single issue
const getSingleIssue = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await issuesService.getSingleIssueFromDB(
      req.params.id as string,
    );

    res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  },
);

// update a issue
const updateAIssue = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await issuesService.updateAIssueIntoDB(
      req.body,
      req.params.id as string,
      req.user as JwtPayload,
    );

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  },
);

// delete a issue
const deleteAIssue = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await issuesService.deleteAIssueFromDB(
      req.params.id as string,
      req.user as JwtPayload,
    );

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  },
);

export const issuesController = {
  createIssue,
  getIssues,
  getSingleIssue,
  updateAIssue,
  deleteAIssue,
};
