import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { userRoute } from "./modules/user/user.route";
import { authRoute } from "./modules/auth/auth.route";
import { issuesRoute } from "./modules/issues/issues.route";

const app: Application = express();
app.use(express.json());

// get root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Assignment 2",
    author: "Jannat",
  });
});

// authentication route
app.use("/api/auth", authRoute);

// issues route
app.use("/api/issues", issuesRoute);

// users
// app.use("/api/users", userRoute);

export default app;
