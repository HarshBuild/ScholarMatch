// ─────────────────────────────────────────────────────────────
// Scholarship data ingestion orchestrator.
//
// Flow:
//   1. Fetch + parse each source via its adapter (adapters.js) → raw records.
//   2. Normalize raw records into our Firestore scholarship schema.
//   3. Convert messy eligibility text → structured JSON (LLM if configured,
//      else deterministic heuristic) via eligibility.js.
//   4. Upsert into Firestore `scholarships` (keyed by name+provider slug).
//   5. If a source yields 0 records (site changed / down / JS-rendered),
//      substitute curated seed entries for that source so the demo always
//      has real scholarships.
//   6. Write a `scholarshipMeta` doc with lastUpdated + counts + errors.
//   7. Return a summary { added, updated, skipped, sources, errors }.
//
// Why we cache in Firestore (not live-scrape per request):
//   - Speed: students get instant local matches.
//   - Reliability: a source site changing structure never breaks the app.
//   - Politeness: we don't hammer external sites on every page load.
//
// This module is environment-agnostic: it accepts a `db` (Firestore instance
// from firebase-admin) and an optional `dryRun` flag. It is used by both the
// Cloud Function (functions/index.js) and the standalone CLI script.
// ─────────────────────────────────────────────────────────────

import { REQUEST_DELAY_MS, SOURCES } from './sources.js';
import { getAdapter } from './adapters.js';
import { extractEligibility } from './eligibility.js';

// Collection names (kept in sync with src/firebase/collections.js). Defined
// locally so the functions package is self-contained when deployed.
const COLLECTIONS = {
  SCHOLARSHIPS: 'scholarships',
  SCHOLARSHIP_META: 'scholarshipMeta',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Polite HTTP fetcher: UA header, timeout, simple retry, inter-request delay.
export async function fetchHTML(url, { retries = 2 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; ScholarshipMatcherBot/1.0; +https://scholarships.gov.in)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
        redirect: 'follow',
      });
      if (!res.ok) {
        console.warn(`[fetch] ${url} → HTTP ${res.status}`);
        return '';
      }
      await sleep(REQUEST_DELAY_MS);
      return await res.text();
    } catch (e) {
      console.warn(`[fetch] ${url} attempt ${attempt + 1} failed: ${e.message}`);
      if (attempt < retries) await sleep(REQUEST_DELAY_MS);
    }
  }
  return '';
}

// Slug used as the dedupe/upsert key: name + provider.
export function dedupeKey(name, provider) {
  return [name, provider || '']
    .join('|')
    .toLowerCase()
    .replace(/[^a-z0-9|]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

// Read the curated seed entries for a given source label (fallback).
async function loadSeedForSource(sourceLabel) {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const seedPath = fileURLToPath(new URL('./seed-scholarships.json', import.meta.url));
  const seed = JSON.parse(readFileSync(seedPath, 'utf-8'));
  return seed.filter((s) => s.source === sourceLabel);
}
// Turn a raw adapter record into our normalized schema (eligibility pending).
function normalizeRaw(raw) {
  return {
    name: (raw.name || '').trim(),
    provider: (raw.provider || '').trim(),
    source: raw.source || 'Unknown',
    sourceUrl: raw.sourceUrl || raw.applyLink || '',
    description: (raw.description || '').trim(),
    amount: (raw.amount || '').trim(),
    deadline: (raw.deadline || ''),
    applyLink: raw.applyLink || raw.sourceUrl || '',
    documentsRequired: raw.documentsRequired || [],
    eligibilityText: (raw.eligibilityText || '').trim(),
    lastUpdated: Date.now(),
  };
}

// Run a single source's adapter, with seed fallback if nothing was scraped.
async function collectFromSource(source, fetchHTMLFn) {
  const adapter = getAdapter(source.adapter);
  let raws = [];
  let usedFallback = false;
  let error = null;
  try {
    if (adapter) raws = await adapter(source, fetchHTMLFn);
  } catch (e) {
    error = `${source.label}: ${e.message}`;
    console.warn(`[ingest] adapter ${source.id} threw:`, e.message);
  }
  // Fallback: substitute curated seed entries for this source.
  if (!raws.length) {
    usedFallback = true;
    raws = await loadSeedForSource(source.label);
    console.log(`[ingest] ${source.label}: 0 scraped → using ${raws.length} curated entries`);
  } else {
    console.log(`[ingest] ${source.label}: scraped ${raws.length} records`);
  }
  return { source, raws, usedFallback, error };
}

// Upsert one normalized scholarship into Firestore (create or update by key).
async function upsertScholarship(db, key, doc, dryRun) {
  if (dryRun) return 'added';
  const ref = db.collection(COLLECTIONS.SCHOLARSHIPS).doc(key);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.set(doc, { merge: true });
    return 'updated';
  }
  await ref.set(doc);
  return 'added';
}

// Main entry.
export async function fetchScholarships({ db, dryRun = false } = {}) {
  const summary = { added: 0, updated: 0, skipped: 0, sources: [], errors: [], startedAt: Date.now() };

  // Collect raw records from every source (in parallel by source, sequential
  // within a source to respect rate limits).
  const collected = [];
  for (const source of SOURCES) {
    collected.push(await collectFromSource(source, fetchHTML));
  }

  // Normalize + extract eligibility, then upsert.
  for (const { source, raws, usedFallback, error } of collected) {
    summary.sources.push({ id: source.id, label: source.label, count: raws.length, usedFallback });
    if (error) summary.errors.push(error);

    for (const raw of raws) {
      if (!raw.name) { summary.skipped++; continue; }
      const normalized = normalizeRaw(raw);

      // Seed entries already have structured eligibility; only call the
      // extractor when eligibility is unstructured text.
      if (raw.eligibility && typeof raw.eligibility === 'object') {
        normalized.eligibility = raw.eligibility;
      } else {
        const { eligibility } = await extractEligibility(normalized.eligibilityText, normalized.name);
        normalized.eligibility = eligibility;
      }

      const key = dedupeKey(normalized.name, normalized.provider);
      if (!key) { summary.skipped++; continue; }

      try {
        const result = await upsertScholarship(db, key, normalized, dryRun);
        summary[result]++;
      } catch (e) {
        summary.errors.push(`upsert(${normalized.name}): ${e.message}`);
        summary.skipped++;
      }
    }
  }

  summary.finishedAt = Date.now();
  summary.durationMs = summary.finishedAt - summary.startedAt;

  // Write meta doc so the UI can show "Data last updated: …".
  if (db && !dryRun) {
    try {
      await db.collection(COLLECTIONS.SCHOLARSHIP_META).doc('latest').set({
        lastUpdated: Date.now(),
        count: summary.added + summary.updated,
        sources: summary.sources,
        errors: summary.errors.slice(0, 20),
        durationMs: summary.durationMs,
      });
    } catch (e) {
      summary.errors.push(`meta write: ${e.message}`);
    }
  }

  console.log(`[ingest] done in ${summary.durationMs}ms — added ${summary.added}, updated ${summary.updated}, skipped ${summary.skipped}`);
  return summary;
}
