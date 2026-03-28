# Book the Weather

A playful booking app where anyone can reserve a weather type for a day, morning, or afternoon. Bookings are public and conflict-safe: once claimed, a slot cannot be overridden.

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

## Supabase setup

1. Create a Supabase project.
2. In Supabase, open the database connection details and copy the `Transaction pooler` URI.
3. Put that exact URI into:

   - local `.env` as `DATABASE_URL`
   - Netlify environment variables as `DATABASE_URL`

4. Run:

   ```bash
   npm run db:setup
   npm run prisma:generate
   ```

5. Redeploy on Netlify after adding the environment variable.

## What `DATABASE_URL` is

It is the one private Postgres connection string that points both your local app and your deployed app to the same shared database. That shared database is what makes bookings visible to every user.

## Booking rules

- A `FULL_DAY` booking blocks the entire date.
- `MORNING` and `AFTERNOON` can both exist on the same date.
- A taken slot cannot be overwritten.
- Weather can be chosen from presets or entered as custom text.

## Netlify notes

- Add `DATABASE_URL` in Netlify environment variables.
- Make sure the variable is available to both Builds and Functions.
- Install the Next.js runtime plugin during deployment if Netlify does not auto-detect it:

  ```bash
  npm install -D @netlify/plugin-nextjs
  ```

- The app is already structured around a shared database, so bookings stay globally visible after deployment.
