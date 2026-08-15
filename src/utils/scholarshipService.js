// Firestore data-access helpers for scholarships + saved scholarships + meta.
//
// OFFLINE-FIRST ARCHITECTURE (critical for rural/low-connectivity students):
// The bundled real scholarship dataset is the PRIMARY source — always
// available, always fast, no Firestore rules required. Firestore is an
// optional enrichment layer: if it reads successfully (rules deployed), we
// MERGE any admin-added/live-ingested scholarships on top of the bundled set.
// If Firestore is unavailable (permission denied / offline), the app still
// shows the full real dataset and matching works perfectly.

import {
  collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where, addDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { BUNDLED_SCHOLARSHIPS } from '../data/bundledScholarships';

// Deduplicate by name (case-insensitive) — bundled entries win ties so the
// verified real data is never silently replaced by a scraped duplicate.
function mergeScholarships(bundled, firestore) {
  const seen = new Map();
  for (const s of bundled) seen.set(s.name.toLowerCase(), s);
  for (const s of firestore) {
    const key = (s.name || '').toLowerCase();
    if (key && !seen.has(key)) seen.set(key, s);
  }
  return Array.from(seen.values());
}

// Fetch all scholarships: bundled real data + any Firestore extras.
// Never throws — on Firestore failure/timeout, returns bundled data only.
export async function getAllScholarships() {
  let firestoreData = [];
  try {
    // Race Firestore against a timeout — Firestore can hang (not reject) when
    // rules are default-deny, which would freeze the UI. 6s cap keeps the app
    // responsive for rural/low-bandwidth users.
    const snap = await Promise.race([
      getDocs(collection(db, COLLECTIONS.SCHOLARSHIPS)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
    ]);
    firestoreData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    // Expected when rules aren't deployed yet — fall back to bundled only.
    console.info('[scholarshipService] Firestore unavailable, using bundled data:', e.code || e.message);
  }
  return mergeScholarships(BUNDLED_SCHOLARSHIPS, firestoreData);
}

// Fetch the ingestion meta doc (for "Data last updated" label).
export async function getScholarshipMeta() {
  try {
    const snap = await getDoc(doc(db, 'scholarshipMeta', 'latest'));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

// ── Saved / bookmark scholarships ────────────────────────────
// Offline-first: localStorage is the source of truth for saved scholarships.
// Firestore syncs when available, but saving ALWAYS works locally.
const SAVED_KEY = (uid) => `sm_saved_${uid || 'guest'}`;

function getLocalSaved() {
  try {
    const uid = getCurrentUid();
    return new Set(JSON.parse(localStorage.getItem(SAVED_KEY(uid)) || '[]'));
  } catch { return new Set(); }
}

function setLocalSaved(set) {
  try {
    localStorage.setItem(SAVED_KEY(getCurrentUid()), JSON.stringify([...set]));
  } catch { /* ignore quota errors */ }
}

let _currentUid = null;
export function setCurrentUid(uid) { _currentUid = uid; }
function getCurrentUid() { return _currentUid; }

export async function getSavedScholarshipIds(uid) {
  if (uid) setCurrentUid(uid);
  const local = getLocalSaved();
  // Try to merge Firestore-saved (best effort).
  try {
    if (uid) {
      const q = query(collection(db, COLLECTIONS.SAVED_SCHOLARSHIPS), where('uid', '==', uid));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => local.add(d.data().scholarshipId));
      setLocalSaved(local);
    }
  } catch { /* Firestore unavailable — local is enough */ }
  return local;
}

export async function saveScholarship(uid, scholarshipId) {
  const set = getLocalSaved();
  set.add(scholarshipId);
  setLocalSaved(set);
  try {
    if (uid) await addDoc(collection(db, COLLECTIONS.SAVED_SCHOLARSHIPS), {
      uid, scholarshipId, savedAt: Date.now(),
    });
  } catch { /* local save already succeeded */ }
}

export async function unsaveScholarship(uid, scholarshipId) {
  const set = getLocalSaved();
  set.delete(scholarshipId);
  setLocalSaved(set);
  try {
    if (uid) {
      const q = query(
        collection(db, COLLECTIONS.SAVED_SCHOLARSHIPS),
        where('uid', '==', uid),
        where('scholarshipId', '==', scholarshipId),
      );
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    }
  } catch { /* local unsave already succeeded */ }
}

// ── Admin CRUD (used by Admin panel) ─────────────────────────
export async function createScholarship(data) {
  const ref = await addDoc(collection(db, COLLECTIONS.SCHOLARSHIPS), {
    ...data, lastUpdated: Date.now(),
  });
  return ref.id;
}

export async function updateScholarship(id, data) {
  await updateDoc(doc(db, COLLECTIONS.SCHOLARSHIPS, id), { ...data, lastUpdated: Date.now() });
}

export async function deleteScholarship(id) {
  await deleteDoc(doc(db, COLLECTIONS.SCHOLARSHIPS, id));
}
