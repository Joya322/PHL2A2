import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";

const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized Access",
          errors: "Token not found",
        });
      }

      const decoded = jwt.verify(token, config.jwt_secret_key) as JwtPayload;

      const queryForUserData = `
        SELECT * FROM users WHERE email=$1
      `;
      const valuesForUserData = [decoded.email];

      const userData = await pool.query(queryForUserData, valuesForUserData);

      const user = userData.rows[0];

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User Not Found",
          errors: "Invalid user",
        });
      }

      req.user = decoded;

      next();
    } catch (error: unknown) {
      return res.status(401).json({
        success: false,
        message: "Invalid Token",
        errors: error,
      });
    }
  };
};

export default auth;
