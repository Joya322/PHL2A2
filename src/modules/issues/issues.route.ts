import { Router } from "express";
import { issuesController } from "./issues.controller";

const router = Router();

// create issue route
router.post("/", issuesController.createIssue);

export const issuesRoute = router;
