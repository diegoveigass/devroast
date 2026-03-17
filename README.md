# DevRoast

DevRoast is a playful web app where you paste a piece of code and get it judged with a more opinionated, roast-style experience.

This project was built during the NLW from Rocketseat and is focused on creating the product interface and interaction flow before connecting any real backend or API.

## What the app does

- lets you paste code into a terminal-inspired editor
- offers a roast mode toggle for a more sarcastic vibe
- shows a leaderboard preview with the most questionable code samples
- uses a custom UI library built specifically for the project visual language

## Current status

The app now supports the full roast creation flow: submit code, run the roast analysis, persist the result, and open the result page with real data.

## Main screens

- home page with editable code input and roast CTA
- component showcase page for the shared UI library

## Tech highlights

- Next.js with App Router
- Tailwind CSS v4 for styling
- Biome for linting and formatting
- Base UI for interactive primitives
- Shiki for server-rendered code highlighting

## Running locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these env vars in `.env.local` before testing the real roast flow:

- `DATABASE_URL`: local Postgres connection string used by the app and tests
- `OPENAI_API_KEY`: required to call the OpenAI provider for real roast generation
- `OPENAI_MODEL`: optional override for the model, defaults to `gpt-4o-mini`

The included `.env.example` already contains a safe local `DATABASE_URL` for the default Docker setup.

If you need the local database:

```bash
npm run db:up
npm run db:migrate
```

Then open `http://localhost:3000`.

## Local roast verification

- automated roast tests use mocked provider calls, so a real `OPENAI_API_KEY` is not required for `npm run test:roasts`
- manual verification of the full roast flow does require a valid `OPENAI_API_KEY`
- for a quick manual check, start the app, paste a code sample on the homepage, submit it, and confirm the app redirects to `/result/[submissionId]` with persisted roast data

## Verification commands

```bash
npm run test:roasts
node --import tsx --test src/trpc/routers/roasts.test.ts
npm run format
npm run lint
npm run build
```
