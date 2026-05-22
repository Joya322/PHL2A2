import type { Request, Response } from "express";
import { authService } from "./auth.service";

// signup user | create user
const signupUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.signupUserIntoDB(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

// login user
const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);

    // console.log(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const authController = {
  signupUser,
  loginUser,
};
