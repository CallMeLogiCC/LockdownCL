import { Pool } from "pg";

const globalForPg = global as typeof global & { pgPool?: Pool };

export const getPool = () => {
  if (globalForPg.pgPool) {
    return globalForPg.pgPool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const shouldUseSsl =
    process.env.PGSSLMODE === "require" || connectionString.includes("sslmode=require");

  const pool = new Pool({
    connectionString,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPg.pgPool = pool;
  }

  return pool;
};
