import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

// user signup
router.post("/signup", authController.signupUser);

// user login
router.post("/login", authController.loginUser);

export const authRoute = router;
