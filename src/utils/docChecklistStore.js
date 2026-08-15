// Document Checklist storage — OFFLINE-FIRST.
//
// For each scholarship, the student ticks off which of the required documents
// (Aadhar, income certificate, marksheet, etc.) they already have ready.
// Progress is persisted per-student in localStorage with Firestore best-effort
// sync, mirroring the applicationStore / savedScholarships pattern.
//
// Schema (per checklist doc):
//   { uid, scholarshipId, checked: { [docName]: true }, updatedAt }

import {
  collection, doc, getDocs, query, setDoc, deleteDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';

const KEY = (uid) => `sm_docs_${uid || 'guest'}`;
let _uid = null;
export function setDocChecklistUid(uid) { _uid = uid; }
function cur() { return _uid; }

function getLocal() {
  try {
    // { [scholarshipId]: { [docName]: true } }
    return JSON.parse(localStorage.getItem(KEY(cur())) || '{}');
  } catch {
    return {};
  }
}

function setLocal(map) {
  try {
    localStorage.setItem(KEY(cur()), JSON.stringify(map));
  } catch { /* ignore */ }
}

// Load all checklists for a user. Returns { [scholarshipId]: { [doc]: true } }.
export async function loadDocChecklists(uid) {
  if (uid) setDocChecklistUid(uid);
  const local = getLocal();

  try {
    if (uid) {
      const q = query(collection(db, COLLECTIONS.DOC_CHECKLISTS), where('uid', '==', uid));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const data = d.data();
        local[data.scholarshipId] = { ...(data.checked || {}) };
      });
      setLocal(local);
    }
  } catch {
    // Firestore unavailable — local is enough.
  }
  return local;
}

// Toggle a single document's checked state for a scholarship.
export async function toggleDoc(uid, scholarshipId, docName) {
  if (uid) setDocChecklistUid(uid);
  const map = getLocal();
  const cur = map[scholarshipId] || {};
  if (cur[docName]) {
    delete cur[docName];
  } else {
    cur[docName] = true;
  }
  map[scholarshipId] = cur;
  setLocal(map);

  try {
    if (uid) {
      await setDoc(
        doc(db, COLLECTIONS.DOC_CHECKLISTS, `${uid}_${scholarshipId}`),
        { uid, scholarshipId, checked: cur, updatedAt: Date.now() },
        { merge: true },
      );
    }
  } catch {
    // local save already succeeded
  }
  return map;
}

// Count how many of the required documents are ready for a scholarship.
export function docProgress(checked = {}, required = []) {
  if (!required?.length) return { ready: 0, total: 0, percent: 100 };
  const ready = required.filter((d) => checked[d]).length;
  return { ready, total: required.length, percent: Math.round((ready / required.length) * 100) };
}
