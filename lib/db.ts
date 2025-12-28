import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const shouldUseSsl =
  process.env.PGSSLMODE === "require" ||
  (connectionString?.includes("sslmode=require") ?? false);

const createPool = () =>
  new Pool({
    connectionString,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined
  });

const globalForPg = global as typeof global & { pgPool?: ReturnType<typeof createPool> };

export const pool = globalForPg.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}
