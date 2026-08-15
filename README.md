🎓 Scholarship Matcher

### Automatic Scholarship Matcher for Students

## 💡 About the Project

**Scholarship Matcher** is a complete student assistant, not just a search engine. Students fill in their profile once and instantly see scholarships they qualify for — ranked by match percentage, complete with deadline reminders, document checklists, and actionable guidance for near-miss matches.

## 🧩 Problem Statement

Many students — especially from rural and economically weaker backgrounds — miss out on scholarships they are eligible for because:

- Information is scattered across many government and private portals.
- Eligibility criteria are complex (income, category, state, course, marks, etc.).
- There is no single place to check which scholarships a student qualifies for.

**Scholarship Matcher** solves this end-to-end: one profile, instant matches, and a clear roadmap for scholarships that are almost within reach.

---

## ⭐ Key Differentiators

| # | Feature | Why it matters |
|---|---------|-----------------|
| 1 | **Profile Completeness Meter** | Shows a weighted % complete score with missing fields, nudging students toward more accurate matches. |
| 2 | **Eligibility Gap Suggestions** | Turns "not eligible" into a roadmap — e.g. *"Score 3% more to qualify"* or *"Check income-revision certificate options."* |
| 3 | **Application Tracker** | Tracks every application (Applied → Under Review → Approved/Rejected) with status badges across the app. |
| 4 | **Deadline Reminders** | Red alert banners for matches due within 7 days, sorted by urgency. |
| 5 | **Document Checklist** | Per-scholarship checklist (Aadhar, income certificate, marksheet, etc.) with progress tracking. |
| 6 | **Hindi Language Support** | Full EN ⇄ HI translation via `react-i18next`, persisted across sessions. |
| 7 | **AI Scholarship Finder (Groq)** | Discovers additional real scholarships using `llama-3.3-70b-versatile`, feeding into the same matching engine. |
| 8 | **Offline-First PWA** | Works on low bandwidth; bundled data loads instantly from `localStorage` if Firestore is unreachable. |
| 9 | **Secure by Design** | Firestore rules ensure students can only access their own data; only admins can write scholarships. |
| 10 | **Real-World Impact** | Every feature is built around the rural/economically-weaker student use case. |

### Scalability

- **Firestore** scales automatically to millions of students with zero provisioning.
- The **matching engine** is a pure client-side `O(n)` function — matching against thousands of scholarships takes milliseconds in-browser.
- **Groq** provides ultra-low-latency serverless AI inference.
- **Cloud Functions** can extend deadline reminders to email/SMS at scale.
- **Offline-first design** keeps the app responsive under poor connectivity.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Auth | Firebase Authentication (Email/Password + Google) |
| Database | Cloud Firestore (NoSQL) |
| Hosting | Firebase Hosting / Render (Static Site) |
| Backend (optional) | Firebase Cloud Functions (matching / deadline reminders) |
| AI | Groq (`llama-3.3-70b-versatile`) for eligibility extraction & AI Finder |
| State Management | React Context API |
| Localization | `react-i18next` (English ⇄ Hindi) |
| Version Control | Git + GitHub |

---

## 🗺 Architecture

```
 ┌──────────────┐      Firebase Auth (Email/Google)      ┌──────────────────┐
 │  React (Vite)│ ─────────────────────────────────────▶ │  Firebase Auth    │
 │  + Tailwind  │                                        └──────────────────┘
 │  + Router    │      Firestore (users, studentProfiles,
 │              │        scholarships, savedScholarships,
 │  Context API │        applications, docChecklists)
 │  (AuthState) │ ─────────────────────────────────────▶ ┌──────────────────┐
 │  + i18n (EN/HI)                                       │  Cloud Firestore  │
 └──────┬───────┘                                        └──────────────────┘
        │  matchScholarships(profile, scholarships)   (pure client fn)
        │    + buildGapSuggestions() (Eligibility Gap)
        ▼
 ┌──────────────────┐   optional: Cloud Functions (deadline reminders)
 │ Matching Engine  │ ─────────────────────────────────▶ ┌──────────────────┐
 │ (ranked matches) │                                     │ Cloud Functions  │
 │ + AI Finder(Groq)│                                     │ (email/SMS)      │
 └──────────────────┘                                     └──────────────────┘
        │
        ▼
 ┌──────────────────┐  Firebase Hosting serves the built React app (PWA)
 │ Student Dashboard│  Offline-first: bundled scholarships + localStorage
 │  Admin Panel     │  (profile, applications, doc checklists, saved)
 │  App Tracker     │
 └──────────────────┘
```

### Data flow (ingestion → cache → match)

```
 Internet sources ──ingestion (Cloud Function / script)──▶ Firestore (cache)
                                                                ▲
   Student app ALWAYS reads from Firestore (instant match) ────┘
```

Live-scraping on every request is slow, unreliable, and risks IP blocks — so ingestion runs on demand (or on a schedule) and caches results in Firestore. The student-facing app always reads from the cache for instant matching.

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

## 🧠 Matching Engine

`src/utils/matchScholarships.js` — a pure, unit-tested JS function with no network calls or side effects:

```js
matchScholarships(studentProfile, scholarshipsList)
  → [{ scholarship, matchScore, matchedCriteria[], missingCriteria[] }]
```

- Each eligibility field (category, income, gender, marks, state, course, disability, minority) is a weighted **criterion**.
- `matchScore` = % of criterion-weight satisfied (hard blockers like income & category weigh more).
- Near-misses are **not hidden** — the card shows exactly which criteria passed (✓) and which failed (✗), so students see *why* they didn't fully match and what to fix.

---

## 🔄 Data Ingestion Pipeline (live internet → Firestore)

### Files

| File | Purpose |
|---|---|
| `functions/index.js` | `refreshScholarships` HTTPS Callable (admin-only) |
| `functions/ingestion/fetchScholarships.js` | Orchestrator (fetch → normalize → extract eligibility → upsert → meta) |
| `functions/ingestion/adapters.js` | Per-source parsers (Buddy4Study, NSP, UGC, AICTE) using `cheerio` |
| `functions/ingestion/eligibility.js` | Groq LLM (llama-3.3-70b) extraction with deterministic heuristic fallback |
| `functions/ingestion/seed-scholarships.json` | 18 real curated scholarships (automatic fallback) |
| `scripts/fetchScholarships.js` | Standalone CLI runner (supports `--dry-run`) |

### Sources (real, public, non-authenticated)

1. National Scholarship Portal — `scholarships.gov.in`
2. AICTE — `aicte-india.org`
3. UGC — `ugc.gov.in`
4. Buddy4Study (aggregator) — `buddy4study.com`
5. State portals (Digital Gujarat, MahaDBT) — represented in the curated seed

### Run ingestion

```bash
# Local dry-run (no Firestore writes, prints summary)
GROQ_API_KEY=your_key node scripts/fetchScholarships.js --dry-run

# Live (writes to Firestore — needs `firebase login`)
GROQ_API_KEY=your_key node scripts/fetchScholarships.js
```

Or click **🔄 Refresh Data** in the Admin panel — it calls the deployed Cloud Function and falls back to seeding the curated JSON directly if the function isn't deployed yet, so the demo always works.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A free [Firebase](https://console.firebase.google.com) project

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/scholarship-matcher.git
cd scholarship-matcher
npm install
```

### 2. Configure Firebase

In the [Firebase Console](https://console.firebase.google.com):

1. **Create a project** (e.g. `scholarship-matcher`).
2. **Add a Web app** (`</>` icon) → register app → copy the config values.
3. **Authentication → Sign-in method** → enable:
   - **Email/Password**
   - **Google** (add a project support email)
4. **Firestore Database → Create database** → start in **production mode** (secure rules ship with this repo). Choose a region close to your users.
5. **Hosting → Get started** (registers `/dist` as the public dir via `firebase.json`).

### 3. Add your Firebase keys

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

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run the dev server

```bash
npm run dev
```

Open **http://localhost:5173**

### 6. Make yourself an admin

After you sign up once, a `users/{uid}` doc is created with `role: "student"`. To access `/admin`, update your doc in the Firebase Console:

```
users/{your-uid} → role: "admin"
```

---

## ⚡ Quick start for the demo (do these 3 things first!)

> If you see "Loading…" forever or empty pages, your Firestore rules are still the default `allow read, write: if false`.

**1. Deploy the Firestore security rules** (ships in `firestore.rules`):

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

**2. Set env vars** — copy `.env.example` to `.env` and fill your Firebase web-app config. For live ingestion, also add:

```env
GROQ_API_KEY=your_groq_key   # optional; heuristic fallback works without it
```

**3. Seed scholarship data** — sign up, make yourself admin (see above), then open **Admin → 🔄 Refresh Data**. If the Cloud Function isn't deployed, the button auto-seeds 18 real scholarships from the curated JSON.

---

## 🔐 Firestore Security Rules (summary)

Full rules live in [`firestore.rules`](./firestore.rules). Key points:

- **`users/{uid}`** — read by any signed-in user; write only own doc; a user **cannot change their own `role`** (prevents self-promotion to admin).
- **`studentProfiles/{uid}`** — read by signed-in users; write/delete only by the owner (uid match).
- **`scholarships/{id}`** — world-readable; **write only by admins** (`users/{uid}.role == "admin"`).
- **`savedScholarships/{id}`** — read/write only by the owning student (`uid == resource.data.uid`).
- **`scholarshipMeta/{id}`** — public read (dashboard shows "data last updated"); admin-only write.

---

## 🚀 Deploy to Render (Static Site Hosting)

This project is a **static SPA** built with Vite — perfect for Render's free **Static Site** hosting. No server to run.

```
GitHub repo  ──push──►  Render build  ──npm run build──►  dist/  ──serve──►  https://scholarship-matcher.onrender.com
                                              │
                                     env vars (VITE_*) injected at build time
```

### Prerequisites

1. A GitHub repo with this code pushed (see [Git Setup](#-git-setup--push-to-github)).
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

   | Field | Value |
   |---|---|
   | Name | `scholarship-matcher` |
   | Branch | `main` |
   | Root Directory | `.` (repo root) |
   | Build Command | `npm ci && npm run build` |
   | Publish Directory | `dist` |

4. Add **Environment Variables**:

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

5. Click **Create Static Site** — Render builds and deploys automatically.

### Step 3 — SPA routing (important)

For React Router routes like `/dashboard` to work on a **direct visit or refresh**, the included `render.yaml` configures a catch-all rewrite to `/index.html`. If you skip the blueprint, add this manually:

- **Dashboard → Redirects/Rewrites → Add Rule**
  - Source: `/*`
  - Destination: `/index.html`
  - Action: **Rewrite** (not Redirect)

The `public/_redirects` file (`/*  /index.html  200`) also covers this as a fallback.

### Step 4 — Firebase authorized domains

In **Firebase Console → Authentication → Settings → Authorized domains**, add your Render URL:

```
scholarship-matcher.onrender.com
```

(Without this, Google login / email login will be blocked by Firebase Auth.)

### Step 5 — Auto-deploy

Every `git push` to `main` triggers a rebuild on Render automatically. Pull-request previews can be enabled under **Settings → Previews**.

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

> **Never** commit `.env` — it holds your Firebase + Groq API keys. `.gitignore` already excludes it. `.env.example` is committed so other developers know which vars to fill.

---

## 📜 Available Scripts

```bash
npm run dev       # start Vite dev server
npm run build     # production build → dist/
npm run preview   # preview the production build locally
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
- [x] **Bonus** — Live data ingestion pipeline (scrapes NSP/UGC/AICTE/Buddy4Study, Groq LLM eligibility extraction, Firestore cache, seed fallback)

---

## 🐞 Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on `npm ci` | Delete `package-lock.json`, run `npm install`, commit, push. |
| Blank page / 404 on refresh | Add the SPA rewrite rule (see [Step 3](#step-3--spa-routing-important)). |
| Login error `auth/unauthorized-domain` | Add your deployed URL to Firebase authorized domains. |
| Firebase config error at runtime | Add all `VITE_*` env vars in your hosting provider. |
| PWA not updating | Hard refresh once; the service worker auto-updates on next load. |
| Blank data / stuck on "Loading…" | Deploy Firestore security rules — default is `allow read, write: if false`. |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
