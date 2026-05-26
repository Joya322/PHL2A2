import { authRoute } from "../modules/auth/auth.route";
import { issuesRoute } from "../modules/issues/issues.route";
import { Router } from "express";

const router = Router();
// authentication route
router.use("/auth", authRoute);

// issues route
router.use("/issues", issuesRoute);

export default router;
