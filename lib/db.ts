import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForPg = global as typeof global & { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}
