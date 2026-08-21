// Standalone scripts (drizzle-kit CLI, migration/seed scripts) run outside
// of Next.js, so they don't get its automatic `.env.local` loading. Import
// this module first in any such entrypoint to fill that gap.
//
// This is a no-op when `.env.local` doesn't exist — e.g. in CI or on
// Vercel, where the platform injects environment variables directly into
// `process.env` instead.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local not present — assume env vars are already set.
}
