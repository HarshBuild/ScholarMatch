// Application Tracker storage — OFFLINE-FIRST.
//
// localStorage is the PRIMARY store (always works, no Firestore rules needed).
// Firestore syncs best-effort: if the write succeeds (rules deployed), the
// tracked applications are shared across devices; if it fails, the local copy
// is still used so the student never loses their application progress.
//
// Schema (per application):
//   { scholarshipId, uid, status, appliedAt, updatedAt, notes }
// where status ∈ APPLICATION_STATUSES ('Applied' | 'Under Review' | 'Approved' | 'Rejected').

import {
  collection, doc, getDocs, query, setDoc, deleteDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { APPLICATION_STATUSES } from './constants';

const APPS_KEY = (uid) => `sm_apps_${uid || 'guest'}`;
let _currentUid = null;
export function setAppUid(uid) { _currentUid = uid; }
function uidOrLocal() { return _currentUid; }

function getLocalApps() {
  try {
    const raw = JSON.parse(localStorage.getItem(APPS_KEY(uidOrLocal())) || '{}');
    return raw; // { [scholarshipId]: { status, appliedAt, updatedAt, notes } }
  } catch {
    return {};
  }
}

function setLocalApps(map) {
  try {
    localStorage.setItem(APPS_KEY(uidOrLocal()), JSON.stringify(map));
  } catch { /* ignore quota */ }
}

const NORMALIZE = { value: 'Applied', review: 'Under Review', approved: 'Approved', rejected: 'Rejected' };

// Load all tracked applications for a user. Local-first, Firestore best-effort.
// Returns a Map: scholarshipId -> { status, appliedAt, updatedAt, notes }
export async function loadApplications(uid) {
  if (uid) setAppUid(uid);
  const local = getLocalApps();

  try {
    if (uid) {
      const q = query(collection(db, COLLECTIONS.APPLICATIONS), where('uid', '==', uid));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const data = d.data();
        const status = NORMALIZE[(data.status || '').toLowerCase()] || APPLICATION_STATUSES[0];
        local[data.scholarshipId] = {
          status,
          appliedAt: data.appliedAt || data.updatedAt || Date.now(),
          updatedAt: data.updatedAt || data.appliedAt || Date.now(),
          notes: data.notes || '',
        };
      });
      setLocalApps(local);
    }
  } catch {
    // Firestore unavailable — local apps are enough.
  }
  return local;
}

// Set or update the status of a tracked application. Creates one if missing.
// Returns the updated map.
export async function setApplicationStatus(uid, scholarshipId, status, notes) {
  if (uid) setAppUid(uid);
  const map = getLocalApps();
  const existing = map[scholarshipId];
  const now = Date.now();
  map[scholarshipId] = {
    status: APPLICATION_STATUSES.includes(status) ? status : APPLICATION_STATUSES[0],
    appliedAt: existing?.appliedAt || now,
    updatedAt: now,
    notes: notes ?? existing?.notes ?? '',
  };
  setLocalApps(map);

  try {
    if (uid) {
      await setDoc(
        doc(db, COLLECTIONS.APPLICATIONS, `${uid}_${scholarshipId}`),
        { uid, scholarshipId, ...map[scholarshipId] },
        { merge: true },
      );
    }
  } catch {
    // local save already succeeded
  }
  return map;
}

// Remove a tracked application (student no longer wants to track it).
export async function removeApplication(uid, scholarshipId) {
  if (uid) setAppUid(uid);
  const map = getLocalApps();
  delete map[scholarshipId];
  setLocalApps(map);

  try {
    if (uid) {
      await deleteDoc(doc(db, COLLECTIONS.APPLICATIONS, `${uid}_${scholarshipId}`));
    }
  } catch {
    // local delete already succeeded
  }
  return map;
}
