import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IUser } from "./auth.interface";


// signup user | create user into DB
const signupUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;

  const hashPassword = await bcrypt.hash(password, 9);

  const result = await pool.query(
    `
              INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4, 'contributor')) RETURNING *
          `,
    [name, email, hashPassword, role],
  );

  delete result.rows[0].password;

  return result;
};

// login user into DB
const loginUserIntoDB = async (payload: IUser) => {
  const result = 0;

  return result;
};

export const authService = {
  signupUserIntoDB,
  loginUserIntoDB,
};
