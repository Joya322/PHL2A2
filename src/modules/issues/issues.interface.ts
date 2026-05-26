import type { ROLES } from "../../types";

export type IssueType = "bug" | "feature_request";

export type IssueStatus = "open" | "in_progress" | "resolved";

export type IssueSort = "newest" | "oldest";

export interface ICreateIssue {
  title: string;
  description: string;
  type: IssueType;
  status?: IssueStatus;
}

export interface IIssue {
  id: number;
  title: string;
  description: string;
  type: IssueType;
  status?: IssueStatus;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}
export interface IReporter {
  name: string;
  role: ROLES;
}
