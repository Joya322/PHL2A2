import type { NextFunction, Request, Response } from "express";
import { issuesService } from "./issues.service";
import type { JwtPayload } from "jsonwebtoken";
import type { IssueSort, IssueStatus, IssueType } from "./issues.interface";

// create Issue
const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await issuesService.createIssueIntoDB(
      req.body,
      req.user as JwtPayload,
    );

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

// get issues
const getIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sort = req.query.sort as IssueSort | undefined;
    const type = req.query.type as IssueType | undefined;
    const status = req.query.status as IssueStatus | undefined;

    const result = await issuesService.getAllIssuesFromDB(sort, type, status);

    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

// get single issue
const getSingleIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await issuesService.getSingleIssueFromDB(
      req.params.id as string,
    );

    res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

// update a issue
const updateAIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
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
  } catch (error: unknown) {
    next(error);
  }
};

// delete a issue
const deleteAIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await issuesService.deleteAIssueFromDB(
      req.params.id as string,
      req.user as JwtPayload,
    );

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const issuesController = {
  createIssue,
  getIssues,
  getSingleIssue,
  updateAIssue,
  deleteAIssue,
};
