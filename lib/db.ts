import { Pool } from "pg";

export const hasDatabaseUrl = () => Boolean(process.env.DATABASE_URL);

const createPool = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const shouldUseSsl =
    process.env.PGSSLMODE === "require" || connectionString.includes("sslmode=require");

  const max = Number(process.env.PG_POOL_MAX ?? 1);
  const normalizedMax = Number.isFinite(max) && max > 0 ? max : 1;

  return new Pool({
    connectionString,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
    max: normalizedMax,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000
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
