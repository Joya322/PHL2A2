import type { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db";
import type { ICreateIssue } from "./issues.interface";
import { report, title } from "process";

const createIssueIntoDB = async (payload: ICreateIssue, user: JwtPayload) => {
  const { title, description, type, status } = payload;

  const { id: reporter_id } = user;

  // console.log(reporter_id);

  const query = `
    INSERT INTO issues(title, description, type, status, reporter_id) VALUES ($1, $2, $3, COALESCE($4, 'open'), $5) RETURNING *
  `;

  const values = [title, description, type, status, reporter_id];

  const result = await pool.query(query, values);

  // console.log(result);

  return result.rows[0];
};

const getAllIssuesFromDB = async (
  sort: string,
  type: string,
  status: string,
) => {
  // query to get all user from issues table
  let queryForAllIssues = `
    SELECT * FROM issues
  `;

  let values: string[] = [];

  if (sort === "newest") {
    queryForAllIssues += ` ORDER BY created_at DESC`;
  } else if (sort === "oldest") {
    queryForAllIssues += ` ORDER BY created_at ASC`;
  } else if (type === "bug") {
    queryForAllIssues += ` WHERE type=$1`;
    values = [type];
  } else if (type === "feature_request") {
    queryForAllIssues += ` WHERE type=$1`;
    values = [type];
  } else if (status === "open") {
    queryForAllIssues += ` WHERE status=$1`;
    values = [status];
  } else if (status === "in_progress") {
    queryForAllIssues += ` WHERE status=$1`;
    values = [status];
  } else if (status === "resolved") {
    queryForAllIssues += ` WHERE status=$1`;
    values = [status];
  } else {
    queryForAllIssues += ` ORDER BY created_at DESC`;
  }

  const result = await pool.query(queryForAllIssues, values);

  if (result.rows.length === 0) {
    throw new Error("No Data Found!");
  }

  const reporters_id = result.rows.map((issue) => {
    return issue.reporter_id;
  });

  // remove duplicate from reporter_id
  const optimizedReportersId = [...new Set(reporters_id)];

  // find reporters
  const reporters = await Promise.all(
    optimizedReportersId.map(async (reportersId) => {
      // query to get reporter details
      const queryForReporterDetails = `
      SELECT * FROM users WHERE id=$1
    `;
      const values = [reportersId];

      const reporter = await pool.query(queryForReporterDetails, values);

      return reporter.rows[0];
    }),
  );

  const data = result.rows.map((issue) => {
    const currentReporter = reporters.find(
      (reporter) => reporter?.id === issue?.reporter_id,
    );

    const issueWithReporterDetails = {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: {
        id: issue.reporter_id,
        name: currentReporter?.name,
        role: currentReporter?.role,
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    };

    return issueWithReporterDetails;
  });

  return data;
};

const getSingleIssueFromDB = async (id: any) => {
  const queryForGettingIssue = `SELECT * FROM issues WHERE id=$1`;
  const valuesForGettingIssue = [id];

  const issueInfo = await pool.query(
    queryForGettingIssue,
    valuesForGettingIssue,
  );

  const issue = issueInfo.rows[0];

  const queryForGettingReporterDetails = `SELECT * FROM users WHERE id=$1`;
  const valuesForGettingReporterDetails = [issue.reporter_id];

  const reporterInfo = await pool.query(
    queryForGettingReporterDetails,
    valuesForGettingReporterDetails,
  );
  const reporter = reporterInfo.rows[0];

  const data = {
    id: issue?.id,
    title: issue?.title,
    description: issue?.description,
    type: issue?.type,
    status: issue?.status,
    reporter: {
      id: issue?.reporter_id,
      name: reporter?.name,
      role: reporter?.role,
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };

  return data;
};

export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
};
