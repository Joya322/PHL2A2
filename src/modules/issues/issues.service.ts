import { pool } from "../../db";
import type { ICreateIssue } from "./issues.interface";

const createIssueIntoDB = async (payload: ICreateIssue) => {
  const { title, description, type, status, reporter_id } = payload;

  const query = `
    INSERT INTO issues(title, description, type, status, reporter_id) VALUES ($1, $2, $3, COALESCE($4, 'open'), $5) RETURNING *
  `;

  const values = [title, description, type, status, reporter_id];

  const result = await pool.query(query, values);

  // console.log(result);

  return result.rows[0];
};

export const issuesService = {
  createIssueIntoDB,
};
