// Student profile storage — OFFLINE-FIRST.
//
// localStorage is the PRIMARY store (always works, no Firestore rules needed).
// Firestore syncs best-effort: if the write succeeds (rules deployed), the
// profile is shared across devices; if it fails (permission denied), the
// profile is still saved locally and matching works immediately.
//
// This guarantees the student never sees "Missing or insufficient permissions"
// — the #1 frustration that blocks rural students from using the app.

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { EMPTY_PROFILE } from './constants';

const PROFILE_KEY = (uid) => `sm_profile_${uid || 'guest'}`;

export function getLocalProfile(uid) {
  try {
    return { ...EMPTY_PROFILE, ...JSON.parse(localStorage.getItem(PROFILE_KEY(uid)) || '{}') };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

function setLocalProfile(uid, profile) {
  try {
    localStorage.setItem(PROFILE_KEY(uid), JSON.stringify(profile));
  } catch { /* ignore */ }
}

// Load profile: local first (instant), then try Firestore to merge any
// cross-device data. Returns the merged profile.
export async function loadProfile(uid) {
  const local = getLocalProfile(uid);
  try {
    if (uid) {
      const snap = await getDoc(doc(db, COLLECTIONS.STUDENT_PROFILES, uid));
      if (snap.exists()) {
        const remote = snap.data();
        // Remote wins for fields that exist, but keep local if remote is empty.
        const merged = { ...local, ...remote };
        setLocalProfile(uid, merged);
        return { ...EMPTY_PROFILE, ...merged };
      }
    }
  } catch {
    // Firestore unavailable — local profile is enough.
  }
  return local;
}

// Save profile: local first (always succeeds), then Firestore best-effort.
// Returns { synced: boolean } so the UI can tell the student.
export async function saveProfile(uid, profile) {
  const normalized = {
    ...profile,
    age: Number(profile.age) || 0,
    income: Number(profile.income) || 0,
    marks: Number(profile.marks) || 0,
    disability: !!profile.disability,
    minority: !!profile.minority,
    updatedAt: Date.now(),
  };
  setLocalProfile(uid, normalized);

  let synced = false;
  try {
    if (uid) {
      await setDoc(doc(db, COLLECTIONS.STUDENT_PROFILES, uid), {
        ...normalized,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      // Also mark profile complete on the user doc.
      await setDoc(doc(db, COLLECTIONS.USERS, uid), {
        profileCompleted: true,
      }, { merge: true });
      synced = true;
    }
  } catch {
    // Firestore write failed (rules not deployed) — local save still succeeded.
  }
  return { synced, profile: normalized };
}
