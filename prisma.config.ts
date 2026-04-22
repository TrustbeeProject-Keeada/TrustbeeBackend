import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const url = env("DATABASE_URL");
if (!url) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url, // guaranteed string
  },
});
