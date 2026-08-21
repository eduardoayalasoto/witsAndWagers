import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== "test") {
  console.warn(
    "DATABASE_URL is not set. Add it to .env.local for local development, " +
      "or to your hosting provider's environment variables (e.g. Railway " +
      "Variables) for deployments. Database queries will fail until this " +
      "is set.",
  );
}

// Decide whether to encrypt the connection. Options, in priority order:
//
// 1. An explicit `sslmode` in the connection string always wins — set
//    `?sslmode=disable` to force plaintext, or `?sslmode=require`/
//    `no-verify` to force TLS.
// 2. Localhost/127.0.0.1 (local Postgres, local Supabase) never uses TLS.
// 3. Railway's private network (`*.railway.internal`) never uses TLS —
//    traffic never leaves Railway's internal network, and its Postgres
//    plugin doesn't terminate SSL there. Use the public proxy host instead
//    if you need an encrypted connection.
// 4. Everything else (Supabase, Railway's public TCP proxy, Neon, etc.)
//    defaults to TLS. We don't verify the certificate chain since most
//    managed providers use certs that aren't in Node's default trust store.
function resolveSsl(url: string | undefined): false | { rejectUnauthorized: boolean } {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes("sslmode=disable")) return false;
  if (lower.includes("sslmode=require") || lower.includes("sslmode=no-verify")) {
    return { rejectUnauthorized: false };
  }
  if (/@(localhost|127\.0\.0\.1)(:|\/)/.test(url)) return false;
  if (lower.includes(".railway.internal")) return false;
  return { rejectUnauthorized: false };
}

// Create a PostgreSQL connection pool.
//
// `max` is kept small since this pool is shared per running instance:
// on Vercel/serverless, each function invocation can spin up its own pool,
// so a large `max` risks exhausting the database's connection limit; on
// Railway (a single long-running instance) a small pool is simply enough
// for this app's traffic. If DATABASE_URL points at Supabase's direct
// connection (db.<project-ref>.supabase.co:5432) rather than its
// connection pooler, this will still fail on serverless platforms — the
// direct connection is IPv6-only on newer Supabase projects. See
// DEPLOYMENT.md.
const pool = new Pool({
  connectionString,
  ssl: resolveSsl(connectionString),
  max: 5,
  idleTimeoutMillis: 10_000,
});

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });
