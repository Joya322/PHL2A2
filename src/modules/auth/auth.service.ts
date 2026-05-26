import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../db";
import type { IUserLogin, IUserSignUp } from "./auth.interface";
import config from "../../config";

// signup user | create user into DB
const signupUserIntoDB = async (payload: IUserSignUp) => {
  const allowedRoles = ["contributor", "maintainer"];

  const { name, email, password, role } = payload;

  const userRole = role ?? "contributor";

  if (!allowedRoles.includes(userRole)) {
    throw new Error("Invalid role");
  }

  const hashPassword = await bcrypt.hash(password, 9);

  const query = `
              INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4, 'contributor')) RETURNING *
          `;
  const values = [name, email, hashPassword, userRole];

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
    throw new Error("Invalid credentials");
  }

  // 2. comparing the password
  const isMatchedPassword = await bcrypt.compare(password, user.password);

  if (!isMatchedPassword) {
    throw new Error("Invalid credentials");
  }

  // 3. generate token
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt_secret_key as string, {
    expiresIn: "20d",
  });

  const userInfo = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  return { token: accessToken, user: userInfo };
};

export const authService = {
  signupUserIntoDB,
  loginUserIntoDB,
};
