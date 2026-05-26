import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import router from "./routes";
import cors from "cors";
import errorHandler from "./middleware/errorHandler";

const app: Application = express();

app.use(cors());
app.use(express.json());

// get root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "DevPulse API Running",
    data: {
      author: "Jannat",
    },
  });
});

app.use("/api", router);
app.use(errorHandler); 

export default app;
