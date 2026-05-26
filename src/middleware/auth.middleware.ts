import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";
import { selectUsersByAColumn } from "../utils/commonQueries";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";

const auth = () =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    if (!token) {
      throw new AppError(401, "Unauthorized Access", "Token not found");
    }

    const decoded = jwt.verify(token, config.jwt_secret_key) as JwtPayload;

    const userData = await pool.query(selectUsersByAColumn("users", "email"), [
      decoded.email,
    ]);

    const user = userData.rows[0];

    if (!user) {
      throw new AppError(401, "User Not Found", "Invalid user");
    }

    req.user = decoded;

    next();
  });

export default auth;
