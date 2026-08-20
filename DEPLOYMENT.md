# Deploying #Trivia

## Prerequisites

- Railway account (free trial, then usage-based pricing)
- Git repository (recommended) — push this repo to GitHub first
- A Supabase project **for Realtime only** (see note below) — the free tier is enough

> **Do you still need Supabase if the database lives on Railway?** Yes, but only for
> live updates. This app's real-time sync (`lib/realtime/`) uses Supabase's Realtime
> **Broadcast** feature, which is a pub/sub channel independent of where your Postgres
> data actually lives — it doesn't read from your database at all. So you'll have two
> separate services: Railway hosts the app and the Postgres data (with a persistent
> volume), and a free Supabase project is used purely as the WebSocket relay for
> broadcasting game events between players' devices. If you'd rather drop Supabase
> entirely, that means replacing `lib/realtime/` with your own WebSocket/SSE layer —
> ask if you want help with that.

## Deploying to Railway

### 1. Create the project

1. Go to [railway.app](https://railway.app) and create a new project.
2. **Deploy from GitHub repo** → select this repository.
3. Railway auto-detects this as a Node.js/Next.js app (via Nixpacks) and uses the
   `railway.json` in this repo, which:
   - builds with `npm run build`
   - runs pending database migrations, then starts the server:
     `npm run db:migrate && npm run start`

### 2. Add a Postgres database (with a volume)

1. In the same Railway project, click **+ New** → **Database** → **Add PostgreSQL**.
   Railway provisions this with a persistent volume automatically — no manual volume
   setup needed.
2. On your app service, go to **Variables** and add:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
   This references the Postgres service's private connection string, so traffic
   between your app and the database stays on Railway's internal network (faster, and
   doesn't count against bandwidth).

### 3. Add the Supabase Realtime variables

On your app service, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

Find these under your Supabase project's **Settings → API**. You don't need to run
any schema or migrations in this Supabase project — it's not storing game data.

### 4. Generate a domain and deploy

1. On your app service, go to **Settings → Networking → Generate Domain** (or attach
   a custom domain).
2. Deploy. Railway builds the app, runs migrations against the fresh database, and
   starts the server.

### 5. Verify

- Visit the generated URL and create a game ("Host a Game").
- Join from another device with the QR code or join code.
- Submit a guess and confirm it shows up live on the host dashboard.

### Redeploying

Every push to the branch Railway is watching triggers a new build. Migrations run
automatically on every deploy (`npm run db:migrate`), and are safe to run repeatedly —
only pending migrations are applied.

## Troubleshooting

### "Database connection failed" / app looks disconnected from the DB

- Confirm `DATABASE_URL` is set on the **app service** (not just the Postgres
  service) and points at `${{Postgres.DATABASE_URL}}`.
- Check the deploy logs for the actual error (Railway dashboard → your service →
  **Deployments** → view logs).
- If you see an SSL-related error (e.g. "the server does not support SSL
  connections"), you're likely connecting over Railway's public TCP proxy instead of
  the private network — either switch to `${{Postgres.DATABASE_URL}}` (private,
  no TLS needed), or append `?sslmode=disable` to whichever `DATABASE_URL` you're
  using.

### "Real-time not working"

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set and
  point at a real Supabase project (see the note at the top of this doc).
- Check the browser console for connection errors.

### "Build failed"

- Check the build logs in the Railway dashboard.
- Verify `npm run build` succeeds locally first.

## Alternative: Deploying to Vercel

Vercel works too, with one important caveat: Vercel's serverless functions run on an
IPv4-only network, so `DATABASE_URL` **must** use Supabase's connection **pooler**
(`aws-0-<region>.pooler.supabase.com`), not the direct connection
(`db.<project-ref>.supabase.co:5432`) — the direct connection is IPv6-only on newer
Supabase projects and will silently fail to connect from Vercel, which looks exactly
like "the app is disconnected from the database".

1. `vercel` (or import the repo from the Vercel dashboard).
2. In **Settings → Environment Variables**, add for Production/Preview/Development:
   ```
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   ```
3. `vercel --prod`, or redeploy from the dashboard after adding the variables.

Since Vercel has no volume/persistent disk of its own, the database still has to be
Supabase (or another managed Postgres) in this setup — there's no Railway-style
"attach a volume" option on Vercel itself.

## Support

- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
