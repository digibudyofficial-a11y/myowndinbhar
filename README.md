# Dinbhar Poster Studio

Dinbhar Poster Studio is a React + Vite + TypeScript web app for building newsroom-ready news posters. It renders 1080×1350 canvases with fixed masthead/footer, template switching, ad rotation, and Firebase-backed auth, role management, and audit logging.

## Features

- 🔐 Firebase Authentication with email/password and passwordless magic links.
- 👥 Role-aware UI (editor/admin) with Firestore security rules enforcing the same permissions.
- 🖼️ Canvas renderer (1080×1350) with three templates, Hindi/English text wrapping, image adjustments, and automatic attribution stamps.
- 📊 Top and bottom ad rotation that advances on every export and full CRUD for administrators.
- ☁️ Export logging to `exports` collection for audit trails.
- 📰 Fixed masthead supplied via `src/components/Masthead.tsx` and editable through the admin console.
- 🌗 Brightness/contrast controls with image letterboxing to keep compositions balanced.

## Prerequisites

- Node.js 20+
- Firebase project with Authentication and Cloud Firestore enabled
- Service account (JSON or application default credentials) for running the seed script

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` (or `.env`) and fill in your Firebase web app credentials:

   ```ini
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_EMAIL_LINK_REDIRECT=http://localhost:5173
   ```

3. Enable Firebase Auth providers:

   - Email/Password (create at least one editor account).
   - Email link (passwordless) with the redirect set to the value of `VITE_FIREBASE_EMAIL_LINK_REDIRECT`.

4. Configure Firestore:

   - Create the following collections/documents when users sign in:
     - `profiles/{uid}` – created automatically on first sign in.
     - `ads/{id}` – manage via the admin console or seed script.
     - `settings/masthead` – created automatically when an admin saves a masthead.
   - Apply `firestore.rules` via the Firebase CLI or console to enforce the documented permissions.

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Visit http://localhost:5173, register an editor account, and sign in.

## Assigning admin roles

Roles live on the `profiles/{uid}` document as `role: "admin" | "editor"`.

To promote a user:

1. Open the Firestore console.
2. Navigate to `profiles/{uid}` for the target user.
3. Update the `role` field from `editor` to `admin`.

Admin users gain access to the Ads/Masthead management console and can write to restricted collections.

## Seeding ads

Populate example ads with the included script (requires `FIREBASE_PROJECT_ID` and application default credentials):

```bash
export FIREBASE_PROJECT_ID=your-project-id
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
npm run seed:ads
```

## Running tests & linting

```bash
npm run lint
npm run test
```

Vitest covers the Hindi/English wrapping logic in `src/lib/canvasRenderer.ts`.

## Production build

```bash
npm run build
npm run preview
```

The build output is in `dist/`. For Netlify deployments:

- Build command: `npm run build`
- Publish directory: `dist`
- Set the same Firebase environment variables in Netlify site settings.

## Project structure

- `src/components` – UI building blocks (canvas, layout, admin tooling).
- `src/pages` – Routed pages (dashboard, admin, login).
- `src/lib` – Firebase init, canvas renderer, hooks, template definitions.
- `firestore.rules` – Security rules matching the documented data model.
- `seedAds.ts` – Helper script to add sample advertisement creatives.

The masthead placeholder lives in `src/components/Masthead.tsx` and can be swapped by editing the exported base64 string or through the admin UI.
