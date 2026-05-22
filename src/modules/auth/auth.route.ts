import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

// user signup route
router.post("/signup", authController.signupUser);

// user login route
router.post("/login", authController.loginUser);

export const authRoute = router;
