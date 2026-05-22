import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../db";
import type { IUserLogin, IUserSignUp } from "./auth.interface";
import config from "../../config";

// signup user | create user into DB
const signupUserIntoDB = async (payload: IUserSignUp) => {
  const { name, email, password, role } = payload;

  const hashPassword = await bcrypt.hash(password, 9);

  const query = `
              INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4, 'contributor')) RETURNING *
          `;
  const values = [name, email, hashPassword, role];

  const result = await pool.query(query, values);

  delete result.rows[0].password;

  return result;
};

// login user into DB
const loginUserIntoDB = async (payload: IUserLogin) => {
  const { email, password } = payload;

  // 1. checking if the user exists or not
  const query = `
      SELECT * FROM users WHERE email=$1
    `;
  const values = [email];

  const userData = await pool.query(query, values);

  const user = userData.rows[0];

  if (!user) {
    throw new Error("User not found!");
  }

  // 2. comparing the password
  const isMatchedPassword = await bcrypt.compare(password, user.password);

  if (!isMatchedPassword) {
    throw new Error("User not found!");
  }

  // 3. generate token
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt_secret_key as string, {
    expiresIn: "20d",
  });

  // console.log(user);

  return { token: accessToken, user: jwtPayload };
};

export const authService = {
  signupUserIntoDB,
  loginUserIntoDB,
};
