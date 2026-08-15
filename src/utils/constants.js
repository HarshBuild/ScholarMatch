// Shared constants for forms and matching across the app.

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Chandigarh', 'Puducherry',
];

export const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];

export const GENDERS = ['Male', 'Female'];

export const EDUCATION_LEVELS = [
  'Class 1-8 (Pre-Matric)',
  'Class 9-10 (Pre-Matric)',
  'Class 11-12',
  'Diploma',
  'Undergraduate',
  'Postgraduate',
  'Doctorate (PhD)',
];

export const COURSES = [
  'Any',
  'Engineering',
  'Technology',
  'Medical',
  'Diploma',
  'Undergraduate',
  'Postgraduate',
  'Pharmacy',
  'Management',
  'Law',
  'Arts',
  'Science',
  'Commerce',
];

// Empty profile template used by the Profile form.
export const EMPTY_PROFILE = {
  age: '',
  gender: '',
  state: '',
  category: '',
  income: '',
  educationLevel: '',
  course: '',
  marks: '',
  disability: false,
  minority: false,
};

// ── Application Tracker ────────────────────────────────────────
// A student tracks each scholarship they apply to through these statuses.
// Ordered loosely by progression; the UI uses these as the dropdown options.
export const APPLICATION_STATUSES = [
  'Applied',
  'Under Review',
  'Approved',
  'Rejected',
];

// Tailwind colour classes per status — kept here so the card and the
// applications page stay in sync.
export const APPLICATION_STATUS_STYLES = {
  'Applied': 'bg-blue-50 text-blue-700 border-blue-200',
  'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
  'Approved': 'bg-green-50 text-green-700 border-green-200',
  'Rejected': 'bg-red-50 text-red-700 border-red-200',
};
