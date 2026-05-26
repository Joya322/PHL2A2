import type { NextFunction, Request, Response } from "express";

const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : "Something went wrong",
    errors: error,
  });
};

export default errorHandler;
