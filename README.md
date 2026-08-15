# 🎓 Scholarship Matcher — Automatic Scholarship Matcher for Students

> A web app that automatically matches students to scholarships they are
> eligible for, based on their profile — instead of manually searching hundreds
> of scattered government and private portals.

---

## 🧩 Problem Statement

Many students — especially from rural and economically weaker backgrounds — miss
scholarships they are eligible for because:

- Information is scattered across many government and private portals.
- Eligibility criteria are complex (income, category, state, course, marks…).
- There is no single place to check which scholarships a student qualifies for.

**Scholarship Matcher** solves this: fill your profile once, and instantly see
matched scholarships ranked by match percentage, with deadline reminders.

---

## 🛠 Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React (Vite) + Tailwind CSS |
| Auth | Firebase Authentication (Email/Password + Google) |
| Database | Cloud Firestore (NoSQL) |
| Hosting | Firebase Hosting |
| Optional backend | Firebase Cloud Functions (matching / deadline reminders) |
| State | React Context API |
| Version control | Git + GitHub |

---

## 📁 Project Structure

```
scholarship-matcher/
├── public/
│   ├── favicon.svg
│   ├── icon-192.png, icon-512.png   # PWA icons
│   └── seed-scholarships.json        # client seed fallback
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── ScholarshipCard.jsx       # matched card (match %, why, save, apply)
│   │   └── InstallPrompt.jsx         # PWA install banner
│   ├── context/
│   │   └── AuthContext.jsx           # auth state + signup/login/logout
│   ├── firebase/
│   │   ├── config.js                 # Firebase init (VITE_* env vars)
│   │   └── collections.js            # collection names + roles
│   ├── pages/
│   │   ├── Landing.jsx, Login.jsx, Signup.jsx
│   │   ├── Dashboard.jsx             # matched scholarships (Firestore + engine)
│   │   ├── Profile.jsx               # student profile form → Firestore
│   │   ├── Browse.jsx                # search/filter all scholarships
│   │   ├── Admin.jsx                 # CRUD + Refresh Data button
│   │   └── NotFound.jsx
│   ├── utils/
│   │   ├── matchScholarships.js      # matching engine (pure, unit-tested)
│   │   ├── scholarshipService.js     # Firestore data-access helpers
│   │   └── constants.js              # states, categories, courses
│   ├── App.jsx, main.jsx, index.css
├── functions/                        # Firebase Cloud Functions
│   ├── index.js                      # refreshScholarships callable (admin-only)
│   ├── package.json
│   └── ingestion/
│       ├── fetchScholarships.js      # orchestrator (fetch→normalize→upsert)
│       ├── adapters.js               # per-source cheerio parsers
│       ├── sources.js                # source config
│       ├── eligibility.js            # Groq LLM + heuristic extractor
│       └── seed-scholarships.json    # 18 real curated scholarships
├── scripts/
│   ├── fetchScholarships.js          # standalone CLI (--dry-run supported)
│   ├── generate-icons.js             # PWA icon generator
│   └── data/seed-scholarships.json
├── firestore.rules, firestore.indexes.json, firebase.json, .firebaserc
├── .env.example, index.html, package.json, tailwind.config.js, vite.config.js
```

---

## ✅ Build Progress

- [x] **Step 1** — React + Vite + Tailwind + folder structure
- [x] **Step 2** — Firebase config (env-based), Firestore rules, Hosting config
- [x] **Step 3** — Auth (Signup/Login/Logout, Google, protected + admin routes)
- [x] **Step 4** — Student profile form → Firestore `studentProfiles`
- [x] **Step 5** — 18 real curated scholarships (NSP, AICTE, UGC, Buddy4Study, state portals)
- [x] **Step 6** — Matching engine (`matchScholarships`) with "why matched / missing" logic
- [x] **Step 7** — Student dashboard (matched cards, sort, save, deadline countdown)
- [x] **Step 8** — Admin panel (role-protected CRUD + **Refresh Data** ingestion button)
- [x] **Step 9** — Browse page (search + filter by state/category)
- [x] **Step 10** — Loading/empty/error states, mobile responsiveness
- [x] **Step 11** — PWA (installable on Android/iOS) + Firebase Hosting ready
- [x] **Step 12** — README + architecture diagram
- [x] **Bonus** — Live data ingestion pipeline (scrapes NSP/UGC/AICTE/Buddy4Study,
      Groq LLM eligibility extraction, Firestore cache, seed fallback)

---

## ⚡ Quick start for the demo (do these 3 things first!)

> If you see "Loading…" forever or empty pages, your Firestore rules are still
> the default `allow read, write: if false`. Fix that here:

**1. Deploy the Firestore security rules** (ships in `firestore.rules`):
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

**2. Set env vars** — copy `.env.example` to `.env` and fill your Firebase
web-app config (already done if you ran earlier steps). For live ingestion add:
```env
GROQ_API_KEY=your_groq_key   # optional; heuristic fallback works without it
```

**3. Seed scholarship data** — sign up, make yourself admin (see below), then
open **Admin → 🔄 Refresh Data**. (If you haven't deployed the Cloud Function,
the button auto-seeds 18 real scholarships from the curated JSON.)

### Make yourself an admin
After signing up once, open Firestore in the Firebase Console and set:
```
users/{your-uid}  →  role: "admin"
```
Then visit `/admin`.

---

## 🚀 Local Setup (Steps 1–2)

### Prerequisites
- Node.js 18+ and npm
- A free [Firebase](https://console.firebase.google.com) project

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Firebase (Firebase Console)

In the [Firebase Console](https://console.firebase.google.com):

1. **Create a project** (e.g. `scholarship-matcher`).
2. **Add a Web app** (`</>` icon) → register app → copy the config values.
3. **Authentication → Sign-in method** → enable:
   - **Email/Password**
   - **Google** (add a project support email)
4. **Firestore Database → Create database** → start in **production mode**
   (we ship secure rules below). Choose a region close to your users.
5. **Hosting → Get started** (registers `/dist` as the public dir via `firebase.json`).

### 3. Add your Firebase keys
Copy the example env file and fill in the values from step 2:
```bash
cp .env.example .env
```
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
> ⚠️ `.env` is git-ignored. **Never commit real keys.**

### 4. Deploy Firestore security rules
Install the Firebase CLI (if not already):
```bash
npm install -g firebase-tools
firebase login
```
Deploy the rules + indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run the dev server
```bash
npm run dev
```
Open http://localhost:5173

### 6. Make yourself an admin
After you sign up once, a `users/{uid}` doc is created with `role: "student"`.
To access `/admin`, change your doc in the Firebase Console:
```
users/{your-uid} → role: "admin"
```

---

## 🔐 Firestore Security Rules (summary)

Full rules live in [`firestore.rules`](./firestore.rules). Key points:

- **`users/{uid}`** — read by any signed-in user; write only own doc; a user
  **cannot change their own `role`** (prevents self-promotion to admin).
- **`studentProfiles/{uid}`** — read by signed-in users; write/delete only by
  the owner (uid match).
- **`scholarships/{id}`** — world-readable; **write only by admins**
  (`users/{uid}.role == "admin"`).
- **`savedScholarships/{id}`** — read/write only by the owning student
  (`uid == resource.data.uid`).
- **`scholarshipMeta/{id}`** — public read (dashboard shows "data last
  updated"); admin-only write.

---

## 🔑 Firestore Data Model

```
users/{uid}                       name, email, role('student'|'admin'), profileCompleted
studentProfiles/{uid}             age, gender, state, category, income, educationLevel,
                                  course, marks, disability, minority
scholarships/{auto}               name, provider, source, sourceUrl, description, amount,
                                  deadline, applyLink, documentsRequired[], lastUpdated
                                  eligibility:{ minIncome, maxIncome, categories[],
                                  states[], courses[], minMarks, genderAllowed[],
                                  disabilityRequired, minorityRequired }
savedScholarships/{auto}          uid, scholarshipId, savedAt
scholarshipMeta/latest            lastUpdated, count, sources[], errors[]
```

---

## 🧠 Matching Engine (`src/utils/matchScholarships.js`)

A pure, unit-tested JS function — no network, no side effects:

```js
matchScholarships(studentProfile, scholarshipsList)
  → [{ scholarship, matchScore, matchedCriteria[], missingCriteria[] }]
```

- Each eligibility field (category, income, gender, marks, state, course,
  disability, minority) is a weighted **criterion**.
- `matchScore` = % of criterion-weight satisfied (hard blockers like income &
  category weigh more).
- Near-misses are **not hidden** — the card shows exactly which criteria passed
  (✓) and which failed (✗), so students see *why* they didn't fully match and
  what to fix. This is the most valuable feature for the target audience.

---

## 🔄 Data Ingestion Pipeline (live internet → Firestore)

### Why cache instead of live-scrape on every request
Live-scraping per user request is slow, unreliable (site structure changes), and
can get our IP blocked. So the architecture is:

```
 Internet sources ──ingestion (Cloud Function / script)──▶ Firestore (cache)
                                                                ▲
   Student app ALWAYS reads from Firestore (instant match) ────┘
```

### Files
- `functions/index.js` — `refreshScholarships` HTTPS Callable (admin-only).
- `functions/ingestion/fetchScholarships.js` — orchestrator (fetch → normalize
  → extract eligibility → upsert → meta).
- `functions/ingestion/adapters.js` — per-source parsers (Buddy4Study, NSP,
  UGC, AICTE) using `cheerio`.
- `functions/ingestion/eligibility.js` — **Groq LLM** (llama-3.3-70b) extraction
  of structured eligibility JSON from messy text, with a deterministic heuristic
  fallback (no key needed).
- `functions/ingestion/seed-scholarships.json` — 18 real curated scholarships
  (used as automatic fallback when a source can't be scraped).
- `scripts/fetchScholarships.js` — standalone CLI runner (supports `--dry-run`).

### Sources (real, public, non-authenticated)
1. National Scholarship Portal — `scholarships.gov.in`
2. AICTE — `aicte-india.org`
3. UGC — `ugc.gov.in`
4. Buddy4Study (aggregator) — `buddy4study.com`
5. State portals (Digital Gujarat, MahaDBT) — represented in the curated seed

### Run ingestion
```bash
# Local dry-run (no Firestore writes, prints summary):
GROQ_API_KEY=your_key node scripts/fetchScholarships.js --dry-run

# Live (writes to Firestore — needs `firebase login`):
GROQ_API_KEY=your_key node scripts/fetchScholarships.js
```

Or click **🔄 Refresh Data** in the Admin panel (calls the deployed Cloud
Function; falls back to seeding the curated JSON directly if the function isn't
deployed yet, so the demo always works).

### Groq API key
Set `GROQ_API_KEY` in `.env` (or the functions env). Without it, the pipeline
uses the heuristic parser — still fully functional. The key is git-ignored.

---

## 📜 Available Scripts
```bash
npm run dev       # start Vite dev server
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

---

## 🗺 Architecture (high level)

```
 ┌──────────────┐      Firebase Auth (Email/Google)      ┌──────────────────┐
 │  React (Vite)│ ─────────────────────────────────────▶ │  Firebase Auth    │
 │  + Tailwind  │                                        └──────────────────┘
 │  + Router    │      Firestore (users, studentProfiles,
 │              │        scholarships, savedScholarships,
 │  Context API │        applications, docChecklists)
 │  (AuthState) │ ─────────────────────────────────────▶ ┌──────────────────┐
 │  + i18n (EN/HI)                                      │  Cloud Firestore  │
 └──────┬───────┘                                        └──────────────────┘
        │  matchScholarships(profile, scholarships)   (pure client fn, Step 6)
        │    + buildGapSuggestions() (Eligibility Gap)
        ▼
 ┌──────────────────┐   optional: Cloud Functions (deadline reminders)
 │ Matching Engine  │ ─────────────────────────────────▶ ┌──────────────────┐
 │ (ranked matches) │                                        │ Cloud Functions  │
 │ + AI Finder(Groq)│                                        │ (email/SMS)      │
 └──────────────────┘                                        └──────────────────┘
        │
        ▼
 ┌──────────────────┐  Firebase Hosting serves the built React app (PWA)
 │ Student Dashboard│  Offline-first: bundled scholarships + localStorage
 │  Admin Panel     │  (profile, applications, doc checklists, saved)
 │  App Tracker     │
 └──────────────────┘
```

---

## ⭐ Key Differentiators (what makes this stand out)

This isn't just a "scholarship search engine" — it's a **complete student assistant**. Here's what sets it apart:

1. **📊 Profile Completeness Meter** — students see exactly how complete their profile is (weighted %), with a live list of missing fields. More complete profiles → more accurate matches. This nudges students toward better data, which improves outcomes.

2. **💡 Eligibility Gap Suggestions** — for near-miss scholarships (50–99% match), the app doesn't just say "not eligible". It gives actionable advice: *"You're close! Score 3.0% more (need ≥ 70%) to qualify."* or *"Your income is ₹1 lakh above the limit — check if you qualify for an income-revision certificate."* This turns rejection into a roadmap.

3. **📋 Application Tracker** — students track every application's status (Applied → Under Review → Approved / Rejected) in one dedicated page. The status badge appears on every scholarship card across the app, so they always know where each application stands.

4. **⏰ Deadline Reminders** — the dashboard surfaces a red alert banner for every matched scholarship whose deadline is within 7 days, sorted by urgency (Today! / Tomorrow! / N days left). The same `deadlineDelta` logic can be reused by a Cloud Function for email/SMS reminders.

5. **📂 Document Checklist** — each scholarship's required documents (Aadhar, income certificate, marksheet, etc.) are shown as a per-student checklist with a progress bar. Students tick off what they have ready; the card turns green when all documents are collected. Persisted offline-first.

6. **🌐 Hindi Language Support** — full UI translation (English ⇄ Hindi) via `react-i18next`, with a one-tap language switcher in the navbar. The choice persists across sessions. This directly serves rural students who are more comfortable in Hindi.

7. **🤖 AI Scholarship Finder (Groq)** — beyond the bundled verified dataset, a Groq-powered AI finder (llama-3.3-70b-versatile) discovers additional real Indian scholarships across government and private portals, matched to the student's profile. The AI returns structured eligibility data that feeds into the same matching engine.

8. **📲 Offline-First PWA** — the app works on low bandwidth. 18 verified scholarships are bundled at build time and load instantly from `localStorage` if Firestore is unreachable. Profile, applications, document checklists, and saved scholarships all sync from localStorage first, with best-effort Firestore sync. Installable as a PWA for home-screen access.

9. **🔒 Secure by Design** — Firestore security rules enforce that students can only read/write their own `studentProfiles`, `applications`, `docChecklists`, and `savedScholarships`. Only admins can write to the `scholarships` collection. Role-based access protects the admin panel route.

10. **📊 Real-world Impact Angle** — every feature is designed around the rural / economically-weaker student: Hindi support, offline-first, deadline reminders, document checklists, and gap suggestions that turn "not eligible" into "here's how to become eligible".

### Scalability story

- **Firestore** is a serverless NoSQL database that scales automatically to millions of students — no provisioning needed.
- The **matching engine** is a pure client-side function (`O(n)` per student, `n` = scholarships), so matching a student against thousands of scholarships takes milliseconds in the browser. No server load per match.
- The **AI Finder** uses Groq's ultra-low-latency inference (llama-3.3-70b), adding serverless AI without infrastructure.
- **Cloud Functions** (optional) can extend deadline reminders to email/SMS at scale using Firebase's built-in scheduling.
- The **offline-first architecture** means the app stays responsive even under poor connectivity — critical for the target rural demographic.

---

## 🚀 Deploy to Render (Static Site Hosting)

This project is a **static SPA** built with Vite — perfect for Render's free
**Static Site** hosting. No server to run.

### Architecture (why Render works)

```
GitHub repo  ──push──►  Render build  ──npm run build──►  dist/  ──serve──►  https://scholarship-matcher.onrender.com
                                              │
                                     env vars (VITE_*) injected at build time
```

### Prerequisites

1. A GitHub repo with this code (pushed — see Git setup below).
2. A Render account (free at [render.com](https://render.com), sign in with GitHub).
3. Your `.env` values handy (Firebase config + optional Groq key).

### Step 1 — Push code to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Scholarship Matcher"
git branch -M main
git remote add origin https://github.com/<your-username>/scholarship-matcher.git
git push -u origin main
```

### Step 2 — Create a Static Site on Render

1. Go to **Dashboard → New → Static Site**.
2. Connect your GitHub account and select the `scholarship-matcher` repo.
3. Fill in:
   - **Name**: `scholarship-matcher`
   - **Branch**: `main`
   - **Root Directory**: `.` (leave blank / repo root)
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variables** (Render dashboard → Environment):

   | Key | Value |
   |-----|-------|
   | `VITE_FIREBASE_API_KEY` | from your `.env` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | from your `.env` |
   | `VITE_FIREBASE_PROJECT_ID` | from your `.env` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | from your `.env` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | from your `.env` |
   | `VITE_FIREBASE_APP_ID` | from your `.env` |
   | `VITE_FIREBASE_MEASUREMENT_ID` | from your `.env` |
   | `VITE_GROQ_API_KEY` | (optional) from your `.env` |

5. Click **Create Static Site**. Render builds and deploys automatically.

### Step 3 — SPA routing (important)

Render serves `dist/` as static files. For React Router routes like
`/dashboard` to work on a **direct visit or refresh** (not just in-app
clicks), the included `render.yaml` configures a catch-all rewrite to
`/index.html`. If you skip the blueprint, add this manually:

- **Dashboard → Redirects/Rewrites → Add Rule**:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: **Rewrite** (not Redirect)

The `public/_redirects` file (`/*  /index.html  200`) also covers this
as a fallback for Render's static file serving.

### Step 4 — Firebase authorized domains

In **Firebase Console → Authentication → Settings → Authorized domains**,
add your Render URL:

```
scholarship-matcher.onrender.com
```

(Without this, Google login / email login will be blocked by Firebase Auth.)

### Step 5 — Auto-deploy

Every `git push` to `main` triggers a rebuild on Render automatically
(enabled by default). Pull-request previews can be enabled under
**Settings → Previews**.

### Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on `npm ci` | Delete `package-lock.json`, run `npm install`, commit, push. |
| Blank page / 404 on refresh | Add the SPA rewrite rule (Step 3). |
| Login error "auth/unauthorized-domain" | Add Render URL to Firebase authorized domains (Step 4). |
| Firebase config error at runtime | Add all `VITE_*` env vars in Render (Step 2). |
| PWA not updating | Hard refresh once; the service worker auto-updates on next load. |

---

## 📦 Git setup & push to GitHub

```bash
# 1. Initialize (skip if .git already exists)
git init
git branch -M main

# 2. Make sure .env is git-ignored (it is — see .gitignore)
git status   # .env should NOT appear here

# 3. Stage and commit everything
git add .
git commit -m "feat: Scholarship Matcher — full app with 18 verified scholarships"

# 4. Create the repo on GitHub (or use the web UI), then push
git remote add origin https://github.com/<your-username>/scholarship-matcher.git
git push -u origin main
```

> **Never** commit `.env` — it holds your Firebase + Groq API keys.
> `.gitignore` already excludes it. The `.env.example` template is
> committed so other developers know which vars to fill.

---

_Scholarship Matcher · Education for All._
#   S c o l e r  
 #   S c h o l a r M a t c h  
 