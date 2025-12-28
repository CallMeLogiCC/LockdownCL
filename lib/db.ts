import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const createPool = () =>
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

const globalForPg = global as typeof global & { pgPool?: ReturnType<typeof createPool> };

export const pool = globalForPg.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}
