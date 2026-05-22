import type { Request, Response } from "express";
import { authService } from "./auth.service";

// signup user | create user
const signupUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.signupUserIntoDB(req.body);
  } catch (error) {
    console.log(error);
  }
};

// login user
const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
  } catch (error) {
    console.log(error);
  }
};

export const authController = {
  signupUser,
  loginUser,
};
