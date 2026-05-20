import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL") ?? "",
    // DIRECT_URL bypasses the pooler for migrations (required with Supabase pooler)
    directUrl: env("DIRECT_URL"),
  },
});
