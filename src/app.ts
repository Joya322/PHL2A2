import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { userRoute } from "./modules/user/user.route";

const app: Application = express();
app.use(express.json());

// get root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Assignment 2",
    author: "Jannat",
  });
});

app.use("/api/users", userRoute);

export default app;
