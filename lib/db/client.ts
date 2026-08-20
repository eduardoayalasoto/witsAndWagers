import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== "test") {
  console.warn(
    "DATABASE_URL is not set. Add it to .env.local for local development, " +
      "or to your hosting provider's environment variables (e.g. Vercel " +
      "Project Settings → Environment Variables) for deployments. " +
      "Database queries will fail until this is set.",
  );
}

// Only localhost/127.0.0.1 connections (local Postgres, local Supabase)
// skip TLS. Every remote provider — including Supabase — requires an
// encrypted connection, and its certificate chain isn't in Node's default
// trust store, so we don't verify it.
const isLocalHost =
  !connectionString || /@(localhost|127\.0\.0\.1)(:|\/)/.test(connectionString);

// Create a PostgreSQL connection pool.
//
// IMPORTANT for Vercel/serverless deployments: each function invocation can
// spin up its own pool, so `max` is kept small here to avoid exhausting
// Supabase's connection limit. If DATABASE_URL points at Supabase's direct
// connection (db.<project-ref>.supabase.co:5432), prefer the connection
// pooler instead (aws-0-<region>.pooler.supabase.com, port 5432 for
// "Session" mode or 6543 for "Transaction" mode) — the direct connection is
// IPv6-only on newer Supabase projects and is not reachable from Vercel's
// IPv4 network, which looks exactly like "the DB is disconnected". See
// DEPLOYMENT.md for details.
const pool = new Pool({
  connectionString,
  ssl: isLocalHost ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10_000,
});

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });
