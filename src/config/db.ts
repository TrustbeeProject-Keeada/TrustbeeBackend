import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  // password: process.env.DB_PASSWORD,
});
