import { Pool } from "pg";

const createPool = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const shouldUseSsl =
    process.env.PGSSLMODE === "require" || connectionString.includes("sslmode=require");

  return new Pool({
    connectionString,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined
  });
};

const globalForPg = global as typeof global & { pgPool?: ReturnType<typeof createPool> };

export const getPool = () => {
  if (globalForPg.pgPool) {
    return globalForPg.pgPool;
  }
  const pool = createPool();

  globalForPg.pgPool = pool;

  return pool;
};
