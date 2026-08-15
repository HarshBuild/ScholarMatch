// ─────────────────────────────────────────────────────────────
// Standalone CLI runner for the scholarship ingestion pipeline.
//
// Runs the SAME logic as the Cloud Function, but from your laptop — useful for
// local testing and for the very first seed of Firestore.
//
// Usage:
//   node scripts/fetchScholarships.js --dry-run     # no Firestore writes, prints summary
//   node scripts/fetchScholarships.js               # writes to Firestore (needs creds)
//
// To write to Firestore from your machine you must authenticate firebase-admin.
// Easiest: run `firebase login` (application-default creds are picked up
// automatically by the Admin SDK). Alternatively set GOOGLE_APPLICATION_CREDENTIALS
// to a service account JSON path. See README "Ingestion" section.
// ─────────────────────────────────────────────────────────────

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fetchScholarships } from '../functions/ingestion/fetchScholarships.js';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n🎓 Scholarship ingestion — ${dryRun ? 'DRY RUN (no writes)' : 'LIVE (writing to Firestore)'}\n`);

  let db = null;
  if (!dryRun) {
    // applicationDefault() picks up `firebase login` creds or
    // GOOGLE_APPLICATION_CREDENTIALS automatically.
    initializeApp({ credential: applicationDefault() });
    db = getFirestore();
  }

  const summary = await fetchScholarships({ db, dryRun });

  console.log('\n────────── INGESTION SUMMARY ──────────');
  console.log(`Added:    ${summary.added}`);
  console.log(`Updated:  ${summary.updated}`);
  console.log(`Skipped:  ${summary.skipped}`);
  console.log(`Duration: ${(summary.durationMs / 1000).toFixed(1)}s`);
  console.log('\nSources:');
  for (const s of summary.sources) {
    console.log(`  - ${s.label}: ${s.count} records${s.usedFallback ? ' (seed fallback)' : ''}`);
  }
  if (summary.errors.length) {
    console.log(`\nErrors (${summary.errors.length}):`);
    for (const e of summary.errors.slice(0, 10)) console.log(`  - ${e}`);
  }
  console.log('──────────────────────────────────────\n');
  process.exit(0);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
