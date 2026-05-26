import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../db";
import type { IUserLogin, IUserSignUp } from "./auth.interface";
import config from "../../config";
import AppError from "../../utils/AppError";

// signup user | create user into DB
const signupUserIntoDB = async (payload: IUserSignUp) => {
  const allowedRoles = ["contributor", "maintainer"];

  const { name, email, password, role } = payload;

  // checking duplicity of email

  const queryToGetAUser = `SELECT * FROM users WHERE email=$1`;

  const valuesToToGetAUser = [email];

  const userAlReadyExist = await pool.query(
    queryToGetAUser,
    valuesToToGetAUser,
  );

  if (userAlReadyExist.rows.length > 0) {
    throw new AppError(409, "User already exists", {
      email: "This email is already registered",
    });
  }

  const userRole = role ?? "contributor";

  if (!allowedRoles.includes(userRole)) {
    throw new Error("Invalid role");
  }

  const hashPassword = await bcrypt.hash(password, 9);

  const queryToCreateAUser = `
              INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4, 'contributor')) RETURNING *
          `;
  const valuesToCreateAUser = [name, email, hashPassword, userRole];

  const result = await pool.query(queryToCreateAUser, valuesToCreateAUser);

  delete result.rows[0].password;

  return result.rows[0];
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
    throw new AppError(401, "Invalid credentials");
  }

  // 2. comparing the password
  const isMatchedPassword = await bcrypt.compare(password, user.password);

  if (!isMatchedPassword) {
    throw new AppError(401, "Invalid credentials");
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
