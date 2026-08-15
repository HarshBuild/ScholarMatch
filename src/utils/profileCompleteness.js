// Profile completeness calculator.
//
// Returns a percentage (0-100) of how complete a student profile is, plus
// the list of fields still missing. Used by the Profile page to show a
// "your profile is X% complete" meter — more complete profiles yield more
// accurate matches, which we surface to the student as motivation.

// Each field's weight in the completeness score. Weights sum to 100.
// Hard matching fields (category, income, state, course, marks) carry more
// weight because they directly determine eligibility results.
export const PROFILE_FIELDS = [
  { key: 'category', label: 'Category', weight: 18 },
  { key: 'income', label: 'Annual family income', weight: 18 },
  { key: 'state', label: 'State', weight: 15 },
  { key: 'course', label: 'Course / stream', weight: 12 },
  { key: 'educationLevel', label: 'Education level', weight: 12 },
  { key: 'marks', label: 'Current marks', weight: 10 },
  { key: 'gender', label: 'Gender', weight: 8 },
  { key: 'age', label: 'Age', weight: 5 },
  { key: 'disability', label: 'Disability status', weight: 1 }, // boolean, treated as always "filled"
  { key: 'minority', label: 'Minority status', weight: 1 },
];

function isFilled(field, profile) {
  const v = profile?.[field.key];
  if (typeof v === 'boolean') return true; // booleans are always a valid answer
  if (v === null || v === undefined) return false;
  const s = String(v).trim();
  return s !== '' && s !== '0';
}

// Returns { percent, missing: [{key,label,weight}] }
export function profileCompleteness(profile) {
  if (!profile) return { percent: 0, missing: PROFILE_FIELDS.slice() };

  let earned = 0;
  const missing = [];
  for (const f of PROFILE_FIELDS) {
    if (isFilled(f, profile)) {
      earned += f.weight;
    } else {
      missing.push(f);
    }
  }
  return { percent: Math.min(100, earned), missing };
}
