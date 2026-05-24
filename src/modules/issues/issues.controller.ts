import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import type { JwtPayload } from "jsonwebtoken";

// create Issue
const createIssue = async (req: Request, res: Response) => {
  try {
    // console.log("controller" ,req.user);
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

// get issues
const getIssues = async (req: Request, res: Response) => {
  try {
    // get sort item
    const sort = req.query.sort;
    const type = req.query.type;
    const status = req.query.status;

    const result = await issuesService.getAllIssuesFromDB(
      sort as string,
      type as string,
      status as string,
    );

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

// get single issue
const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.getSingleIssueFromDB(req.params.id);

    res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
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

// update a issue
const updateAIssue = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.updateAIssueIntoDB(
      req.body,
      req.params.id,
      req.user as JwtPayload,
    );

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
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

// delete a issue
const deleteAIssue = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.deleteAIssueFromDB(req.params.id, req.user as JwtPayload);

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
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
  getSingleIssue,
  updateAIssue,
  deleteAIssue,
};
