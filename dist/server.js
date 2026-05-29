

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  database_url: process.env.DATABASE_URL,
  port: process.env.PORT,
  jwt_secret_key: process.env.JWT_SECRET_KEY
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({ connectionString: config_default.database_url });
var initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,

            name VARCHAR(30) NOT NULL,

            email VARCHAR(40) UNIQUE NOT NULL,

            password TEXT NOT NULL,

            role VARCHAR(20) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await pool.query(`
          CREATE TABLE IF NOT EXISTS issues(
            id SERIAL PRIMARY KEY,

            title VARCHAR(150) NOT NULL,

            description TEXT CHECK(LENGTH(description) >= 20) NOT NULL,

            type VARCHAR(30) NOT NULL CHECK (type IN ('bug', 'feature_request')),

            status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),

            reporter_id INT NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
          `);
  } catch (error) {
    console.error(error);
  }
};

// src/utils/AppError.ts
var AppError = class extends Error {
  statusCode;
  errors;
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
};
var AppError_default = AppError;

// src/utils/commonQueries.ts
var selectDataByAColumn = (tableName, columnName) => {
  return `SELECT * FROM ${tableName} WHERE ${columnName}=$1`;
};

// src/modules/auth/auth.service.ts
var signupUserIntoDB = async (payload) => {
  const allowedRoles = ["contributor", "maintainer"];
  const { name, email, password, role } = payload;
  const userAlReadyExist = await pool.query(
    selectDataByAColumn("users", "email"),
    [email]
  );
  if (userAlReadyExist.rows.length > 0) {
    throw new AppError_default(409, "User already exists", {
      email: "This email is already registered"
    });
  }
  const userRole = role ?? "contributor";
  if (!allowedRoles.includes(userRole)) {
    throw new Error("Invalid role");
  }
  const hashPassword = await bcrypt.hash(password, 9);
  const queryToCreateAUser = `
              INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4, 'contributor')) RETURNING *
          `;
  const valuesToCreateAUser = [name, email, hashPassword, userRole];
  const result = await pool.query(queryToCreateAUser, valuesToCreateAUser);
  delete result.rows[0].password;
  return result.rows[0];
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(selectDataByAColumn("users", "email"), [
    email
  ]);
  const user = userData.rows[0];
  if (!user) {
    throw new AppError_default(401, "Invalid credentials", "Invalid email or password");
  }
  const isMatchedPassword = await bcrypt.compare(password, user.password);
  if (!isMatchedPassword) {
    throw new AppError_default(401, "Invalid credentials", "Invalid email or password");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const accessToken = jwt.sign(jwtPayload, config_default.jwt_secret_key, {
    expiresIn: "20d"
  });
  const userInfo = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
  return { token: accessToken, user: userInfo };
};
var authService = {
  signupUserIntoDB,
  loginUserIntoDB
};

// src/utils/catchAsync.ts
var catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
var catchAsync_default = catchAsync;

// src/modules/auth/auth.controller.ts
var signupUser = catchAsync_default(async (req, res) => {
  const result = await authService.signupUserIntoDB(req.body);
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result
  });
});
var loginUser = catchAsync_default(async (req, res) => {
  const result = await authService.loginUserIntoDB(req.body);
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result
  });
});
var authController = {
  signupUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signupUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/utils/issueFormatter.ts
var formatIssueWithReporter = (issue, reporter) => {
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: {
      id: issue.reporter_id,
      name: reporter?.name,
      role: reporter?.role
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var issueFormatter_default = formatIssueWithReporter;

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload, user) => {
  const { title, description, type, status } = payload;
  const allowedIssueTypes = ["bug", "feature_request"];
  if (type && !allowedIssueTypes.includes(type)) {
    throw new AppError_default(400, "Invalid issue type", {
      type: "Allowed values are bug, feature_request"
    });
  }
  const { id, role } = user;
  if (status && role !== USER_ROLE.maintainer) {
    throw new AppError_default(403, "Forbidden action", {
      status: "A contributor can not input status of an issue"
    });
  }
  const query = `
    INSERT INTO issues(title, description, type, status, reporter_id) VALUES ($1, $2, $3, COALESCE($4, 'open'), $5) RETURNING *
  `;
  const values = [title, description, type, status, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};
var getAllIssuesFromDB = async (sort, type, status) => {
  const allowedSortValues = ["newest", "oldest"];
  const allowedIssueTypes = ["bug", "feature_request"];
  const allowedIssueStatuses = ["open", "in_progress", "resolved"];
  if (sort && !allowedSortValues.includes(sort)) {
    throw new AppError_default(400, "Invalid sort value", {
      sort: "Allowed values are newest, oldest"
    });
  }
  if (type && !allowedIssueTypes.includes(type)) {
    throw new AppError_default(400, "Invalid issue type", {
      type: "Allowed values are bug, feature_request"
    });
  }
  if (status && !allowedIssueStatuses.includes(status)) {
    throw new AppError_default(400, "Invalid issue status", {
      status: "Allowed values are open, in_progress, resolved"
    });
  }
  let queryForAllIssues = `
  SELECT * FROM issues
  `;
  let values = [];
  let conditions = [];
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length > 0) {
    queryForAllIssues += ` WHERE ` + conditions.join(" AND ");
  }
  if (sort === "oldest") {
    queryForAllIssues += ` ORDER BY created_at ASC`;
  } else {
    queryForAllIssues += ` ORDER BY created_at DESC`;
  }
  const result = await pool.query(queryForAllIssues, values);
  if (result.rows.length === 0) {
    throw new AppError_default(404, "No data found");
  }
  const reporters_id = result.rows.map((issue) => {
    return issue.reporter_id;
  });
  const optimizedReportersId = [...new Set(reporters_id)];
  const reporters = await Promise.all(
    optimizedReportersId.map(async (reportersId) => {
      const queryForReporterDetails = `
      SELECT * FROM users WHERE id=$1
      `;
      const values2 = [reportersId];
      const reporter = await pool.query(queryForReporterDetails, values2);
      if (!reporter.rows[0]) {
        const reporterInfo2 = {
          id: reportersId,
          name: "Reporter not exist"
        };
        return reporterInfo2;
      }
      const reporterInfo = {
        id: reporter.rows[0].id,
        name: reporter.rows[0].name,
        role: reporter.rows[0].role
      };
      return reporterInfo;
    })
  );
  const data = result.rows.map((issue) => {
    const currentReporter = reporters.find(
      (reporter) => reporter.id === issue.reporter_id
    );
    return issueFormatter_default(issue, currentReporter);
  });
  return data;
};
var getSingleIssueFromDB = async (id) => {
  const queryForGettingIssue = `SELECT * FROM issues WHERE id=$1`;
  const valuesForGettingIssue = [id];
  const issueInfo = await pool.query(
    queryForGettingIssue,
    valuesForGettingIssue
  );
  const issue = issueInfo.rows[0];
  if (!issue) {
    throw new AppError_default(404, "Issue not found");
  }
  const queryForGettingReporterDetails = `SELECT * FROM users WHERE id=$1`;
  const valuesForGettingReporterDetails = [issue.reporter_id];
  const reporter = await pool.query(
    queryForGettingReporterDetails,
    valuesForGettingReporterDetails
  );
  if (reporter.rows.length === 0) {
    const reporterInfo2 = {
      id: issue.reporter_id,
      name: "Reporter not exist"
    };
    return issueFormatter_default(issue, reporterInfo2);
  }
  const { id: reporter_id, name, role } = reporter.rows[0];
  const reporterInfo = {
    id: reporter_id,
    name,
    role
  };
  return issueFormatter_default(issue, reporterInfo);
};
var updateAIssueIntoDB = async (payload, id, user) => {
  const { title, description, type, status } = payload;
  const allowedIssueTypes = ["bug", "feature_request"];
  const allowedIssueStatuses = ["open", "in_progress", "resolved"];
  if (type && !allowedIssueTypes.includes(type)) {
    throw new AppError_default(400, "Invalid issue type", {
      type: "Allowed values are bug, feature_request"
    });
  }
  if (status && !allowedIssueStatuses.includes(status)) {
    throw new AppError_default(400, "Invalid issue status", {
      status: "Allowed values are open, in_progress, resolved"
    });
  }
  const queryForGettingIssue = `SELECT * FROM issues WHERE id=$1`;
  const valuesForGettingIssue = [id];
  const issueInfo = await pool.query(
    queryForGettingIssue,
    valuesForGettingIssue
  );
  const issue = issueInfo.rows[0];
  if (!issue) {
    throw new AppError_default(404, "Issue not found to update");
  }
  if (user.role !== "maintainer") {
    if (!(issue.reporter_id === user.id && issue.status === "open")) {
      throw new AppError_default(403, "Forbidden action", {
        status: "A contributor can only update own issue if status is open"
      });
    }
  }
  let queryForUpdatingIssue = "";
  let valuesForUpdatingIssue = [];
  if (user.role === "maintainer") {
    queryForUpdatingIssue = `
    UPDATE issues SET
    title = COALESCE($1, title),
    description = COALESCE($2, description),
    type = COALESCE($3, type),
    status = COALESCE($4, status), 
    updated_at = CURRENT_TIMESTAMP
  
    WHERE id=$5 RETURNING *
    `;
    valuesForUpdatingIssue = [title, description, type, status, id];
  } else {
    if ("status" in payload) {
      throw new AppError_default(400, "Invalid update fields", {
        status: "Only maintainer can update issue status"
      });
    }
    queryForUpdatingIssue = `
    UPDATE issues SET
    title = COALESCE($1, title),
    description = COALESCE($2, description),
    type = COALESCE($3, type),
    updated_at = CURRENT_TIMESTAMP
    
    WHERE id=$4 RETURNING *
    `;
    valuesForUpdatingIssue = [title, description, type, id];
  }
  const result = await pool.query(
    queryForUpdatingIssue,
    valuesForUpdatingIssue
  );
  return result.rows[0];
};
var deleteAIssueFromDB = async (id, user) => {
  if (user.role !== "maintainer") {
    throw new AppError_default(
      401,
      "Unauthorized Credential",
      "status: Only maintainer can delete a issue"
    );
  }
  const result = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);
  if (!result.rows[0]) {
    throw new AppError_default(404, "Issue not found");
  }
  const query = `DELETE FROM issues WHERE id=$1`;
  const values = [id];
  const deleted = await pool.query(query, values);
  return deleted;
};
var issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateAIssueIntoDB,
  deleteAIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = catchAsync_default(
  async (req, res, next) => {
    const result = await issuesService.createIssueIntoDB(
      req.body,
      req.user
    );
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  }
);
var getIssues = catchAsync_default(
  async (req, res, next) => {
    const sort = req.query.sort;
    const type = req.query.type;
    const status = req.query.status;
    const result = await issuesService.getAllIssuesFromDB(sort, type, status);
    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  }
);
var getSingleIssue = catchAsync_default(
  async (req, res, next) => {
    const result = await issuesService.getSingleIssueFromDB(
      req.params.id
    );
    res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  }
);
var updateAIssue = catchAsync_default(
  async (req, res, next) => {
    const result = await issuesService.updateAIssueIntoDB(
      req.body,
      req.params.id,
      req.user
    );
    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  }
);
var deleteAIssue = catchAsync_default(
  async (req, res, next) => {
    await issuesService.deleteAIssueFromDB(
      req.params.id,
      req.user
    );
    res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  }
);
var issuesController = {
  createIssue,
  getIssues,
  getSingleIssue,
  updateAIssue,
  deleteAIssue
};

// src/middleware/auth.middleware.ts
import jwt2 from "jsonwebtoken";
var auth = () => catchAsync_default(async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    throw new AppError_default(401, "Unauthorized Access", "Token not found");
  }
  const decoded = jwt2.verify(token, config_default.jwt_secret_key);
  const userData = await pool.query(selectDataByAColumn("users", "email"), [
    decoded.email
  ]);
  const user = userData.rows[0];
  if (!user) {
    throw new AppError_default(401, "User Not Found", "Invalid user");
  }
  req.user = decoded;
  next();
});
var auth_middleware_default = auth;

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", auth_middleware_default(), issuesController.createIssue);
router2.get("/", issuesController.getIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.patch("/:id", auth_middleware_default(), issuesController.updateAIssue);
router2.delete("/:id", auth_middleware_default(), issuesController.deleteAIssue);
var issuesRoute = router2;

// src/routes/index.ts
import { Router as Router3 } from "express";
var router3 = Router3();
router3.use("/auth", authRoute);
router3.use("/issues", issuesRoute);
var routes_default = router3;

// src/app.ts
import cors from "cors";

// src/middleware/errorHandler.ts
var errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errors = null;
  if (err instanceof AppError_default) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors ?? null;
  } else if (err instanceof Error) {
    message: err.message;
  }
  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
var errorHandler_default = errorHandler;

// src/app.ts
var app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevPulse API Running",
    data: {
      author: "Jannat"
    }
  });
});
app.use("/api", routes_default);
app.use(errorHandler_default);
var app_default = app;

// src/server.ts
var port = config_default.port;
var main = async () => {
  try {
    await initDB();
    app_default.listen(port, () => {
      console.log(`App running on the port ${port}`);
    });
  } catch (error) {
    console.error(error);
  }
};
main();
//# sourceMappingURL=server.js.map