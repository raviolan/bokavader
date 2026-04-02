# Book the Weather

A playful booking app where anyone can reserve a weather type for a day, morning, or afternoon. Bookings are public and conflict-safe: once claimed, a slot cannot be overridden.

The app is location-aware. Each calendar is scoped to a selected country, region, or city, and broader bookings cascade down into narrower calendars.

## Stack

- Next.js App Router
- Prisma
- PostgreSQL
- Mobile-first CSS

## Easiest hosted database option

I recommend Supabase for the first deployment because it gives you a hosted Postgres database and its docs explicitly tell you to use the `Transaction pooler` connection string for transient/serverless platforms.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file and add a PostgreSQL connection string:

   ```bash
   cp .env.example .env
   ```

3. Generate the Prisma client:

   ```bash
   npm run prisma:generate
   ```

4. Apply the database schema:

   ```bash
   npm run db:setup
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

Without `DATABASE_URL`, the app still renders so you can inspect the UI, but booking submissions stay disabled until a shared PostgreSQL database is configured.

## Skip database for now

If you want to continue building the UI without fighting database setup yet, set:

```bash
DISABLE_DATABASE=true
```

With `DISABLE_DATABASE=true`, the app stays in UI-only mode even if `DATABASE_URL` is present, so Prisma will not try to connect until you remove that flag later.

## Supabase setup

1. Create a Supabase project.
2. In Supabase, open the database connection details and copy:

   - `Transaction pooler` URI for `DATABASE_URL`
   - `Session pooler` URI for `DIRECT_URL`
3. Put that exact URI into:

   - local `.env` as `DATABASE_URL` and `DIRECT_URL`
   - Netlify environment variables as `DATABASE_URL` and `DIRECT_URL`

4. For Prisma with Supabase poolers, append `?pgbouncer=true&connection_limit=1` to `DATABASE_URL` if it is not already present.

5. Run:

   ```bash
   npm run db:setup
   npm run prisma:generate
   ```

5. Redeploy on Netlify after adding the environment variable.
   Netlify is configured to run `prisma migrate deploy` during build, so the shared database schema stays aligned with the deployed app code.

## What `DATABASE_URL` is

It is the one private Postgres connection string that points both your local app and your deployed app to the same shared database. That shared database is what makes bookings visible to every user.

## Booking rules

- A `FULL_DAY` booking blocks the entire date.
- `MORNING` and `AFTERNOON` can both exist on the same date.
- A taken slot cannot be overwritten.
- Bookings are scoped to a normalized location.
- Broader bookings such as `Sweden` appear in narrower calendars such as `Skane` or `Gothenburg`.
- Weather can be chosen from presets or entered as custom text.
- Bookings can optionally include a longer occasion note that is shown with the saved booking.

## Location search

- The header location picker uses a server-side proxy to the public Photon geocoding demo service.
- Search is limited to country, region, and city-like results so the app does not create street-level calendars.
- The selected location is kept in the URL and persisted locally in the browser.

## Netlify notes

- Add `DATABASE_URL` in Netlify environment variables.
- Add `DIRECT_URL` in Netlify environment variables too, so Prisma migrations can use the session pooler during deploys.
- Make sure the variable is available to both Builds and Functions.
- Install the Next.js runtime plugin during deployment if Netlify does not auto-detect it:

  ```bash
  npm install -D @netlify/plugin-nextjs
  ```

- The app is already structured around a shared database, so bookings stay globally visible after deployment.

## Supabase security note

- Enable Row Level Security on the `Booking` table.
- This app reads and writes bookings through the server-side Prisma connection, not through the public Supabase client APIs.
- With RLS enabled and no public policies added, anonymous access through the Supabase Data API is blocked while the app can continue using its private database connection.
