// ──────────────────────────────────────────────────────────────
// Firebase initialization for the Scholarship Matcher web app.
// All configuration is read from environment variables (VITE_*)
// loaded from .env — never hardcode Firebase keys in source.
// ──────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Fail fast with a clear message instead of a confusing SDK error
// if the developer forgot to copy .env.example → .env.
const missing = Object.entries(firebaseConfig).filter(([, v]) => !v);
if (missing.length) {
  throw new Error(
    `[firebase/config] Missing values for: ${missing
      .map(([k]) => k)
      .join(', ')}. Copy .env.example to .env and fill in your Firebase config.`,
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
