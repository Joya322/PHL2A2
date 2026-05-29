import type { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db";
import type {
  ICreateIssue,
  IIssue,
  IReporter,
  IssueSort,
  IssueStatus,
  IssueType,
} from "./issues.interface";
import formatIssueWithReporter from "../../utils/issueFormatter";
import AppError from "../../utils/AppError";
import { USER_ROLE } from "../../types";

// create a issue in db
const createIssueIntoDB = async (payload: ICreateIssue, user: JwtPayload) => {
  const { title, description, type, status } = payload;

  const allowedIssueTypes = ["bug", "feature_request"];

  // validate type
  if (type && !allowedIssueTypes.includes(type)) {
    throw new AppError(400, "Invalid issue type", {
      type: "Allowed values are bug, feature_request",
    });
  }

  const { id, role } = user;
  if (status && role !== USER_ROLE.maintainer) {
    throw new AppError(403, "Forbidden action", {
      status: "A contributor can not input status of an issue",
    });
  }

  const query = `
    INSERT INTO issues(title, description, type, status, reporter_id) VALUES ($1, $2, $3, COALESCE($4, 'open'), $5) RETURNING *
  `;

  const values = [title, description, type, status, id];

  const result = await pool.query(query, values);

  return result.rows[0];
};

// get all issues from db
const getAllIssuesFromDB = async (
  sort?: IssueSort,
  type?: IssueType,
  status?: IssueStatus,
) => {
  const allowedSortValues = ["newest", "oldest"];

  const allowedIssueTypes = ["bug", "feature_request"];

  const allowedIssueStatuses = ["open", "in_progress", "resolved"];

  // validate sort
  if (sort && !allowedSortValues.includes(sort)) {
    throw new AppError(400, "Invalid sort value", {
      sort: "Allowed values are newest, oldest",
    });
  }

  // validate type
  if (type && !allowedIssueTypes.includes(type)) {
    throw new AppError(400, "Invalid issue type", {
      type: "Allowed values are bug, feature_request",
    });
  }

  // validate status
  if (status && !allowedIssueStatuses.includes(status)) {
    throw new AppError(400, "Invalid issue status", {
      status: "Allowed values are open, in_progress, resolved",
    });
  }

  // query to get all user from issues table
  let queryForAllIssues = `
  SELECT * FROM issues
  `;

  let values: string[] = [];
  let conditions: string[] = [];

  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length > 0) {
    queryForAllIssues += ` WHERE ` + conditions.join(" AND ");
  }

  if (sort === "oldest") {
    queryForAllIssues += ` ORDER BY created_at ASC`;
  } else {
    queryForAllIssues += ` ORDER BY created_at DESC`;
  }

  const result = await pool.query(queryForAllIssues, values);

  if (result.rows.length === 0) {
    throw new AppError(404, "No data found");
  }

  const reporters_id = result.rows.map((issue) => {
    return issue.reporter_id;
  });

  // remove duplicate from reporter_id
  const optimizedReportersId = [...new Set(reporters_id)];

  // find reporters
  const reporters = await Promise.all(
    optimizedReportersId.map(async (reportersId: number) => {
      // query to get reporter details
      const queryForReporterDetails = `
      SELECT * FROM users WHERE id=$1
      `;
      const values = [reportersId];

      const reporter = await pool.query(queryForReporterDetails, values);

      if (!reporter.rows[0]) {
        const reporterInfo: IReporter = {
          id: reportersId,
          name: "Reporter not exist",
        };

        return reporterInfo;
      }

      const reporterInfo: IReporter = {
        id: reporter.rows[0].id,
        name: reporter.rows[0].name,
        role: reporter.rows[0].role,
      };

      return reporterInfo;
    }),
  );

  const data = result.rows.map((issue: IIssue) => {
    const currentReporter = reporters.find(
      (reporter) => reporter.id === issue.reporter_id,
    );

    return formatIssueWithReporter(issue, currentReporter as IReporter);
  });

  return data;
};

// get a single issue from db
const getSingleIssueFromDB = async (id: string) => {
  const queryForGettingIssue = `SELECT * FROM issues WHERE id=$1`;
  const valuesForGettingIssue = [id];

  const issueInfo = await pool.query(
    queryForGettingIssue,
    valuesForGettingIssue,
  );

  const issue: IIssue = issueInfo.rows[0];

  if (!issue) {
    throw new AppError(404, "Issue not found");
  }

  const queryForGettingReporterDetails = `SELECT * FROM users WHERE id=$1`;
  const valuesForGettingReporterDetails = [issue.reporter_id];

  const reporter = await pool.query(
    queryForGettingReporterDetails,
    valuesForGettingReporterDetails,
  );

  if (reporter.rows.length === 0) {
    const reporterInfo: IReporter = {
      id: issue.reporter_id,
      name: "Reporter not exist",
    };

    return formatIssueWithReporter(issue, reporterInfo);
  }

  const { id: reporter_id, name, role } = reporter.rows[0];

  const reporterInfo: IReporter = {
    id: reporter_id,
    name: name,
    role: role,
  };

  return formatIssueWithReporter(issue, reporterInfo);
};

// update a issue in db
const updateAIssueIntoDB = async (
  payload: ICreateIssue,
  id: string,
  user: JwtPayload,
) => {
  const { title, description, type, status } = payload;

  const allowedIssueTypes = ["bug", "feature_request"];

  const allowedIssueStatuses = ["open", "in_progress", "resolved"];

  // validate type
  if (type && !allowedIssueTypes.includes(type)) {
    throw new AppError(400, "Invalid issue type", {
      type: "Allowed values are bug, feature_request",
    });
  }

  // validate status
  if (status && !allowedIssueStatuses.includes(status)) {
    throw new AppError(400, "Invalid issue status", {
      status: "Allowed values are open, in_progress, resolved",
    });
  }

  const queryForGettingIssue = `SELECT * FROM issues WHERE id=$1`;
  const valuesForGettingIssue = [id];

  const issueInfo = await pool.query(
    queryForGettingIssue,
    valuesForGettingIssue,
  );

  const issue = issueInfo.rows[0];

  if (!issue) {
    throw new AppError(404, "Issue not found to update");
  }

  if (user.role !== "maintainer") {
    if (!(issue.reporter_id === user.id && issue.status === "open")) {
      throw new AppError(403, "Forbidden action", {
        status: "A contributor can only update own issue if status is open",
      });
    }
  }

  let queryForUpdatingIssue = "";
  let valuesForUpdatingIssue: (string | undefined)[] = [];

  if (user.role === "maintainer") {
    queryForUpdatingIssue = `
    UPDATE issues SET
    title = COALESCE($1, title),
    description = COALESCE($2, description),
    type = COALESCE($3, type),
    status = COALESCE($4, status), 
    updated_at = CURRENT_TIMESTAMP
  
    WHERE id=$5 RETURNING *
    `;
    valuesForUpdatingIssue = [title, description, type, status, id];
  } else {
    if ("status" in payload) {
      throw new AppError(400, "Invalid update fields", {
        status: "Only maintainer can update issue status",
      });
    }
    queryForUpdatingIssue = `
    UPDATE issues SET
    title = COALESCE($1, title),
    description = COALESCE($2, description),
    type = COALESCE($3, type),
    updated_at = CURRENT_TIMESTAMP
    
    WHERE id=$4 RETURNING *
    `;
    valuesForUpdatingIssue = [title, description, type, id];
  }

  const result = await pool.query(
    queryForUpdatingIssue,
    valuesForUpdatingIssue,
  );

  return result.rows[0];
};

// delete a issue from db
const deleteAIssueFromDB = async (id: string, user: JwtPayload) => {
  if (user.role !== "maintainer") {
    throw new AppError(
      401,
      "Unauthorized Credential",
      "status: Only maintainer can delete a issue",
    );
  }

  const result = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);

  if (!result.rows[0]) {
    throw new AppError(404, "Issue not found");
  }

  const query = `DELETE FROM issues WHERE id=$1`;
  const values = [id];
  const deleted = await pool.query(query, values);

  return deleted;
};

export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateAIssueIntoDB,
  deleteAIssueFromDB,
};
