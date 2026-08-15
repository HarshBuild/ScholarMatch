# Scholarship Matcher — Project Memory

## What this project is
SIH (Smart India Hackathon) project: web app that auto-matches students to
scholarships based on their profile. React + Vite + Tailwind + Firebase
(Auth, Firestore, Hosting).

## Build plan (12 steps) — ALL COMPLETE ✅
- Step 1: React + Vite + Tailwind + folder structure ✅
- Step 2: Firebase config (env-based), Firestore rules, Hosting config ✅
- Step 3: Auth (email+Google, protected + admin routes) ✅
- Step 4: Student profile form → Firestore studentProfiles ✅
- Step 5: 18 real curated scholarships (NSP/AICTE/UGC/Buddy4Study) ✅
- Step 6: matchScholarships.js matching engine (weighted, why-matched) ✅
- Step 7: Dashboard (Firestore + matching, sort, save, countdown) ✅
- Step 8: Admin panel (CRUD + Refresh Data ingestion button) ✅
- Step 9: Browse page (search/filter by state/category) ✅
- Step 10: Loading/empty/error states, mobile responsiveness ✅
- Step 11: PWA installable + Firebase Hosting config ✅
- Step 12: README + architecture diagram ✅
- Bonus: Live data ingestion pipeline (scrape + Groq LLM + Firestore cache) ✅

## Matching engine (src/utils/matchScholarships.js)
- Pure function: matchScholarships(profile, scholarships) → sorted matches
- Each eligibility field is a weighted criterion (income/category/gender weigh
  more than disability/minority). matchScore = % weight satisfied.
- Near-misses NOT hidden — card shows ✓ matched + ✗ missing criteria.

## Data ingestion pipeline (functions/ingestion/ + scripts/fetchScholarships.js)
- Orchestrator: fetch sources → normalize → Groq LLM eligibility extraction
  (heuristic fallback) → upsert to Firestore → write scholarshipMeta/latest.
- Sources: NSP (scholarships.gov.in), AICTE, UGC, Buddy4Study. Live scraping
  is unreliable per-request (SPAs/JS-rendered), so results are CACHED in
  Firestore; student app always reads from Firestore (instant match).
- Admin "Refresh Data" button calls refreshScholarships Cloud Function; falls
  back to seeding public/seed-scholarships.json directly if function not deployed.
- CLI: `GROQ_API_KEY=... node scripts/fetchScholarships.js --dry-run`
- Verified: 17 scholarships, Groq LLM extraction working with user's key.
- GROQ_API_KEY stored in git-ignored .env (NEVER commit).

## CRITICAL: Firestore rules must be deployed
- The student app gets HTTP 403 PERMISSION_DENIED if rules are default-deny.
- Deploy: `firebase deploy --only firestore:rules`
- Rules in firestore.rules: scholarships world-readable (admin-write),
  studentProfiles owner-only, savedScholarships owner-only, scholarshipMeta
  public-read/admin-write.

## Key conventions
- Firebase config reads VITE_* env vars; throws at runtime if missing.
- Collection names + roles centralized in src/firebase/collections.js.
- Tailwind shared component classes (.btn-primary, .card, .input, .label) in index.css.
- Role-based access: user.role from Firestore users/{uid} doc. Admin writes
  scholarships (enforced by firestore.rules). Users can't change own role.
- .env is git-ignored; .env.example is the template. Demo env used for local
  run testing only (placeholder values).

## How to run
- `npm install` then `npm run dev` (port 5173).
- Needs a .env with VITE_FIREBASE_* values or the app throws in-browser.
- `npm run build` compiles even without env (config throws at runtime only).
- PWA: `npm run build && npx vite preview --host 0.0.0.0 --port 12000`
  → public phone link: https://work-1-shrynsnrhodmtquu.prod-runtime.all-hands.dev/
- vite.config.js preview.allowedHosts includes '.prod-runtime.all-hands.dev'
  so the public workhost URL is not blocked.
- Icons generated via `node scripts/generate-icons.js` (pure Node PNG encoder).
- vite-plugin-pwa installed. virtual:pwa-register/react registered in App.jsx.
- InstallPrompt component shows install banner (Android native, iOS instructions).

## Firestore rules location
- firestore.rules (role-based). Deploy: firebase deploy --only firestore:rules,firestore:indexes

## Real Firebase project
- Project: clghelpdesk (provided by user). .env holds real keys (git-ignored).
