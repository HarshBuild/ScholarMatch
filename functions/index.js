// Firebase Cloud Functions for Scholarship Matcher.
//
// `refreshScholarships` is an HTTPS Callable function. It is admin-only: a
// caller's Firestore users/{uid}.role must equal 'admin'. This is the function
// the Admin panel "Refresh Scholarship Data" button calls during the demo so
// judges can watch fresh scholarship data get pulled from the internet.
//
// Deploy:  firebase deploy --only functions
// Local:   see scripts/fetchScholarships.js for a standalone dry-run.

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fetchScholarships } from './ingestion/fetchScholarships.js';

initializeApp();

export const refreshScholarships = onCall(
  { region: 'us-central1', memory: '512MiB', timeoutSeconds: 120 },
  async (request) => {
    // ── Auth guard: only admins may trigger ingestion. ──
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    const userDoc = await getFirestore().collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      throw new HttpsError('permission-denied', 'Admins only.');
    }

    // ── Run ingestion. ──
    try {
      const summary = await fetchScholarships({ db: getFirestore(), dryRun: false });
      return {
        ok: true,
        added: summary.added,
        updated: summary.updated,
        skipped: summary.skipped,
        sources: summary.sources,
        errors: summary.errors.slice(0, 10),
        durationMs: summary.durationMs,
      };
    } catch (e) {
      console.error('[refreshScholarships] failed:', e);
      throw new HttpsError('internal', `Ingestion failed: ${e.message}`);
    }
  },
);
