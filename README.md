Bookmark Saga Web
=================

Scaffolded with Next.js App Router, Tailwind CSS v4, NextAuth (Google), react-icons, and a starter integration to Google Drive `appData` for storing bookmarks per user.

Getting Started
---------------

1) Install dependencies

```
npm install
```

2) Configure environment variables

Copy `.env.local.example` to `.env.local` and fill the values:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: from Google Cloud Console (OAuth 2.0 Client ID)
- `NEXTAUTH_URL`: e.g. `http://localhost:3000`
- `NEXTAUTH_SECRET`: any long random string

Enable the Google Drive API in your Google project. The app requests the `drive.appdata` scope.

3) Run the dev server

```
npm run dev
```

Open `http://localhost:3000`. Click “Sign in with Google” to sign in and you’ll be redirected to `/bookmarks`. The app will create/read a `bookmarks.json` file in your Drive `appData` folder.

Project Structure
-----------------

- `src/app/page.tsx` – Home with Google Sign-In
- `src/app/bookmarks/page.tsx` – Bookmarks UI (sidebar + list), server-rendered
- `src/app/api/auth/[...nextauth]/route.ts` – Auth route by NextAuth
- `src/auth.ts` – Server helpers: `auth`, `signIn`, `signOut`
- `src/auth.config.ts` – Central NextAuth config (Google provider + scopes)
- `src/lib/drive.ts` – Helpers to read/create appData JSON file
 - `src/lib/schemas/bookmarks.schema.json` – JSON Schema for legacy export import
 - `src/lib/extract.ts` – Helpers to validate and convert legacy export JSON → app bookmarks

Notes
-----

- UI is a minimal dark-theme inspired by the provided screenshot; adjust styles as needed.
- Write endpoints for creating/updating bookmarks can be added under `src/app/api/bookmarks` using the same `accessToken`.
