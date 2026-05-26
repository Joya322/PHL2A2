import type { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db";
import type {
  ICreateIssue,
  IssueSort,
  IssueStatus,
  IssueType,
} from "./issues.interface";
import formatIssueWithReporter from "../../utils/issueFormatter";

// create a issue in db
const createIssueIntoDB = async (payload: ICreateIssue, user: JwtPayload) => {
  const { title, description, type, status } = payload;

  const { id: reporter_id } = user;

  const query = `
    INSERT INTO issues(title, description, type, status, reporter_id) VALUES ($1, $2, $3, COALESCE($4, 'open'), $5) RETURNING *
  `;

  const values = [title, description, type, status, reporter_id];

  const result = await pool.query(query, values);


  return result.rows[0];
};

// get all issues from db
const getAllIssuesFromDB = async (
  sort?: IssueSort,
  type?: IssueType,
  status?: IssueStatus,
) => {
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
    return [];
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

      if (!reporter) {
        throw new Error("Reporter not found");
      }

      return reporter.rows[0];
    }),
  );

  const data = result.rows.map((issue) => {
    const currentReporter = reporters.find(
      (reporter) => reporter?.id === issue?.reporter_id,
    );

    return formatIssueWithReporter(issue, currentReporter);
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

  const issue = issueInfo.rows[0];

  if (!issue) {
    throw new Error("Issue not found");
  }

  const queryForGettingReporterDetails = `SELECT * FROM users WHERE id=$1`;
  const valuesForGettingReporterDetails = [issue.reporter_id];

  const reporterInfo = await pool.query(
    queryForGettingReporterDetails,
    valuesForGettingReporterDetails,
  );

  const { name, role } = reporterInfo.rows[0];

  if (!name && !role) {
    throw new Error("Reporter not found");
  }

  const data = formatIssueWithReporter(issue, { name, role });

  return data;
};

// update a issue in db
const updateAIssueIntoDB = async (
  payload: ICreateIssue,
  id: string,
  user: JwtPayload,
) => {
  const { title, description, type, status } = payload;

  const queryForGettingIssue = `SELECT * FROM issues WHERE id=$1`;
  const valuesForGettingIssue = [id];

  const issueInfo = await pool.query(
    queryForGettingIssue,
    valuesForGettingIssue,
  );

  const issue = issueInfo.rows[0];

  if (!issue) {
    throw new Error(`No issue found for id = ${id}`);
  }

  if (user.role !== "maintainer") {
    if (!(issue.reporter_id === user.id && issue.status === "open")) {
      throw new Error("Unauthorized Credential!");
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
    queryForUpdatingIssue = `
      UPDATE issues SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      type = COALESCE($3, type),
      updated_at = CURRENT_TIMESTAMP

      WHERE id=$5 RETURNING *
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
    throw new Error("Unauthorized Credential");
  }

  const result = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);

  if (!result.rows[0]) {
    throw new Error("Issue not found");
  }
  const query = `DELETE FROM issues WHERE id=$1`;
  const values = [id];
  await pool.query(query, values);

  return { deleted: true };
};

export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateAIssueIntoDB,
  deleteAIssueFromDB,
};
