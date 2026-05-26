import type { NextFunction, Request, Response } from "express";
import { authService } from "./auth.service";
import catchAsync from "../../utils/catchAsync";

// signup user | create user
const signupUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.signupUserIntoDB(req.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
});
// login user
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUserIntoDB(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

export const authController = {
  signupUser,
  loginUser,
};
