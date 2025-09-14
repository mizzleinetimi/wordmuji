# WordMuji on Devvit (Reddit)

This directory contains the Devvit (Reddit) app implementation for WordMuji.

## Requirements
- Devvit CLI: `npm i -g devvit`
- Reddit developer account access

## Quick start
1. Log in to Devvit:
   ```bash
   devvit login
   ```
2. Initialize or link the app (interactive):
   ```bash
   devvit new --template typescript
   ```
   If you already have an app code, pass it to the command, or follow the browser flow to create one, then re-run `devvit new <code>` here.
3. Run locally:
   ```bash
   devvit dev
   ```
4. Upload when ready:
   ```bash
   devvit upload
   ```

## Structure
- `src/data/wordData.ts` – words and emoji hints (ported from the web app)
- `src/lib/random.ts` – deterministic PRNG for daily seeding
- `src/lib/daily.ts` – UTC daily word generation and countdown utilities
- `src/lib/models.ts` – types for stats and daily progress
- `src/lib/storage.ts` – KV helpers for user stats and daily progress
- `src/main.ts` – Devvit entry point (custom post type placeholder)

## Notes
- Daily rollover uses UTC midnight for consistency across Reddit.
- Storage uses KV keys: `user:{userId}:stats` and `user:{userId}:daily:{yyyyMMdd}`.
- UI and full gameplay logic will be implemented using Devvit Kit components and event handlers.
