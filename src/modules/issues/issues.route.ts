import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";
import { issuesService } from "./issues.service";

const router = Router();

// create issue route
router.post("/", auth(), issuesController.createIssue);

// get issue route
router.get("/", issuesController.getIssues);

// get single issue route
router.get("/:id", issuesController.getSingleIssue);

// update issue route
router.patch("/:id", auth(), issuesController.updateAIssue);

export const issuesRoute = router;
