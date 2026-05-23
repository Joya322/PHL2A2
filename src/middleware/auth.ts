import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";

const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      //   console.log(req.headers.authorization);
      const token = req.headers.authorization;

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized Access",
        });
      }

      const decoded = jwt.verify(
        token as string,
        config.jwt_secret_key,
      ) as JwtPayload;

      const query = `
        SELECT * FROM users WHERE email=$1
      `;
      const values = [decoded.email];
      const userData = await pool.query(query, values);

      const user = userData.rows[0];

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User Not Found",
        });
      }

      req.user = decoded;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
