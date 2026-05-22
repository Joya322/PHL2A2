import { Pool } from "pg";
import config from "../config";

// create connection with DB
export const pool = new Pool({ connectionString: config.connection_string });

export const initDB = async () => {
  try {
    // users table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(30) NOT NULL,
            email VARCHAR(40) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(20) DEFAULT 'contributor',

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `);

    // issues table
    await pool.query(`
          CREATE TABLE IF NOT EXISTS issues(
            id SERIAL PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            description TEXT CHECK(LENGTH(description) >= 20) NOT NULL,
            type VARCHAR(20) NOT NULL,
            status VARCHAR(20) DEFAULT 'open',
            reporter_id INT NOT NULL,

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
          `);
    // console.log("connected");
  } catch (error) {
    console.log(error);
  }
};
