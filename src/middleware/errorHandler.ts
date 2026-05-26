import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError";

const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errors: unknown = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors ?? null;
  } else if (err instanceof Error) {
    message: err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export default errorHandler;
