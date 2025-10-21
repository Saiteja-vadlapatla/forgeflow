import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_PUBLIC_URL) {
  throw new Error("DATABASE_PUBLIC_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_PUBLIC_URL!,
  },
});
