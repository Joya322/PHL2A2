import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const config = {
  database_url: process.env.DATABASE_URL as string,

  port: process.env.PORT,

  jwt_secret_key: process.env.JWT_SECRET_KEY as string,
};

export default config;
