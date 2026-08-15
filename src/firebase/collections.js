// Shared Firestore collection names used across the app.
// Centralizing them prevents typo bugs and makes refactor trivial.
export const COLLECTIONS = {
  USERS: 'users',
  STUDENT_PROFILES: 'studentProfiles',
  SCHOLARSHIPS: 'scholarships',
  SAVED_SCHOLARSHIPS: 'savedScholarships',
  APPLICATIONS: 'applications', // Application Tracker: one doc per student+scholarship
  DOC_CHECKLISTS: 'docChecklists', // Document Checklist: per student+scholarship
};

// User roles used by Firestore security rules and the Admin route guard.
export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
};
