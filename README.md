# Tractor Outdoor CRM — starter project

This is the first working slice of the custom CRM described in `CRM-Spec.md`:
sign-in, Accounts (clients & agencies), and Contacts (personal/relationship
profiles), with the full data model already in place for everything else
(Contracts, Activities, Leads, growth tracking, automated triggers) to be
built on top of.

**Built for a non-technical reader to follow.** If you get stuck on any step,
that's normal — this is the point where handing off to a developer (or asking
for help finishing a step) makes sense.

## What you'll need first

1. **Node.js** installed on your computer (version 18 or later). Get it from
   [nodejs.org](https://nodejs.org) — the "LTS" version.
2. A **free GitHub account** ([github.com](https://github.com)) — where this
   code will eventually live.
3. A **free Neon account** ([neon.tech](https://neon.tech)) or Supabase
   account — this hosts the actual database.
4. A **free Vercel account** ([vercel.com](https://vercel.com)) — this is
   where the app itself runs once it's live.

None of these cost anything at this size.

## Running it on your own computer (first check)

1. Open a terminal in this folder.
2. Install everything the project depends on:
   ```
   npm install
   ```
3. Create your Neon (or Supabase) account, create a new project, and copy the
   "connection string" it gives you.
4. Copy `.env.example` to a new file named `.env`, and paste your connection
   string in as `DATABASE_URL`. Generate a value for `NEXTAUTH_SECRET` by
   running `openssl rand -base64 32` in your terminal and pasting the result.
5. Create the database tables from the schema, and load the starter data
   (the Category list and the three Admin logins):
   ```
   npx prisma migrate dev --name init
   ```
6. Start the app:
   ```
   npm run dev
   ```
7. Open [http://localhost:3000](http://localhost:3000) in your browser. Sign
   in with one of the seeded admin emails (see `prisma/seed.ts`) and the
   placeholder password printed in your terminal after step 5 — **then change
   it immediately**, since it's the same for all three admins right now.

## Pushing this to GitHub

1. On github.com, click "New repository," give it a name (e.g.
   `tractor-crm`), and leave it empty (no README/license) — this project
   already has those.
2. Back in your terminal, in this folder:
   ```
   git init
   git add .
   git commit -m "Initial CRM scaffold"
   git branch -M main
   git remote add origin <the URL GitHub gives you for your new repo>
   git push -u origin main
   ```

## Deploying it (so the team can use it, not just you)

1. On vercel.com, "Add New Project," and import the GitHub repo you just
   pushed.
2. Add the same environment variables from your `.env` file in Vercel's
   project settings (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — set
   this one to your actual Vercel URL once you have it).
3. Deploy. Every push to `main` after this redeploys automatically.

## What's built vs. what's next

**Built:** sign-in (email/password, no third-party auth vendor), the full
database schema (`prisma/schema.prisma`) for every entity in the spec, and
working screens for Accounts and Contacts — list, create, and detail views,
including the team roster and linked-agency views.

**Not yet built** (all designed in `CRM-Spec.md`, ready to add next):
- Contract entry screens (trade/non-trade deals, ROFR tracking)
- The DOOHclick Sales Report monthly import
- Lead tracking
- Automated triggers (birthday cadence, future contract-renewal reminders) —
  these need Resend and Vercel Cron set up, which isn't done yet
- Account growth / market benchmark reporting screens

## Project structure

```
/prisma
  schema.prisma   # the full data model
  seed.ts         # Category taxonomy + initial Admin users
/app
  /accounts       # list, new, detail pages
  /contacts       # list, new, detail pages
  /api            # the CRUD endpoints those pages call
  login/          # sign-in page
/lib
  prisma.ts       # shared database client
  auth.ts         # sign-in logic (checks email + password against User table)
/components       # shared UI (nav bar, forms)
```
