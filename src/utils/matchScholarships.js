// ─────────────────────────────────────────────────────────────
// Scholarship Matching Engine — pure JS, unit-testable.
//
// matchScholarships(studentProfile, scholarshipsList)
//   → [{ scholarship, matchScore, matchedCriteria[], missingCriteria[] }]
//   sorted by matchScore descending.
//
// Design:
//   Each eligibility field is a "criterion". A scholarship is a MATCH if it
//   passes every criterion. We still surface near-misses (e.g. 1 criterion
//   failed) so the student can see what they're missing — this is one of the
//   most valuable features for the target audience (rural students who often
//   miss small eligibility details).
//
//   matchScore is computed as a weighted percentage of satisfied criteria.
//   Hard blockers (income/category/gender) carry more weight than softer ones.
// ─────────────────────────────────────────────────────────────

// Criterion weights (sum doesn't need to be 100; scores are normalized).
const WEIGHTS = {
  category: 25, // hard social-justice requirement
  income: 20, // hard economic requirement
  gender: 15, // hard for women-only / men-only schemes
  marks: 15, // merit requirement
  state: 10, // domicile requirement
  course: 10, // education-stream requirement
  disability: 5, // special-category requirement
  minority: 5, // special-category requirement
};
const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

// Helper: treat empty/missing eligibility arrays/values as "no restriction".
function isRestricted(arr) {
  return Array.isArray(arr) && arr.length > 0;
}

// ── Criterion checkers. Each returns { passed, label } ──

function checkCategory(profile, elig) {
  if (!isRestricted(elig.categories)) return { passed: true };
  const ok = elig.categories.includes(profile.category);
  return { passed: ok, label: `Category: ${elig.categories.join(', ')} (you: ${profile.category || '—'})` };
}

function checkIncome(profile, elig) {
  const income = Number(profile.income);
  if (!income || income <= 0) {
    // student hasn't entered income → can't confirm; treat as soft miss.
    return { passed: false, label: 'Income: not specified in your profile' };
  }
  const max = Number(elig.maxIncome) || Number.MAX_SAFE_INTEGER;
  const min = Number(elig.minIncome) || 0;
  const ok = income >= min && income <= max;
  return {
    passed: ok,
    label: `Income ≤ ₹${(max / 100000).toFixed(1)} lakh (you: ₹${(income / 100000).toFixed(1)} lakh)`,
  };
}

function checkGender(profile, elig) {
  if (!isRestricted(elig.genderAllowed)) return { passed: true };
  const ok = elig.genderAllowed.includes(profile.gender);
  return { passed: ok, label: `Gender: ${elig.genderAllowed.join('/')} (you: ${profile.gender || '—'})` };
}

function checkMarks(profile, elig) {
  const marks = Number(profile.marks);
  const min = Number(elig.minMarks) || 0;
  if (!min) return { passed: true };
  if (!marks && marks !== 0) {
    return { passed: false, label: `Marks: min ${min}% (not specified)` };
  }
  const ok = marks >= min;
  return { passed: ok, label: `Marks ≥ ${min}% (you: ${marks}%)` };
}

function checkState(profile, elig) {
  if (!isRestricted(elig.states)) return { passed: true };
  const ok = elig.states.includes(profile.state);
  return { passed: ok, label: `State: ${elig.states.join(', ')} (you: ${profile.state || '—'})` };
}

function checkCourse(profile, elig) {
  if (!isRestricted(elig.courses)) return { passed: true };
  // 'Any' or empty → no restriction.
  const courses = elig.courses.filter((c) => c && c.toLowerCase() !== 'any');
  if (!courses.length) return { passed: true };
  // Match if student's course appears in the list OR their education level covers it.
  const pc = (profile.course || '').toLowerCase();
  const pl = (profile.educationLevel || '').toLowerCase();
  const ok = courses.some(
    (c) => pc.includes(c.toLowerCase()) || pl.includes(c.toLowerCase()) || c.toLowerCase().includes(pc),
  );
  return { passed: ok, label: `Course: ${courses.join(', ')} (you: ${profile.course || profile.educationLevel || '—'})` };
}

function checkDisability(profile, elig) {
  if (!elig.disabilityRequired) return { passed: true };
  const ok = !!profile.disability;
  return { passed: ok, label: 'Disability: required (you must be differently-abled)' };
}

function checkMinority(profile, elig) {
  if (!elig.minorityRequired) return { passed: true };
  const ok = !!profile.minority;
  return { passed: ok, label: 'Minority: required (you must be from a minority community)' };
}

const CHECKS = [
  ['category', checkCategory],
  ['income', checkIncome],
  ['gender', checkGender],
  ['marks', checkMarks],
  ['state', checkState],
  ['course', checkCourse],
  ['disability', checkDisability],
  ['minority', checkMinority],
];

// ── Eligibility Gap Suggestions ───────────────────────────────
// For near-miss criteria, produce actionable advice the student can follow
// to become eligible. Only criteria that CAN be closed by the student's
// own action get a suggestion (e.g. "improve marks by X%" — yes;
// "change your category" — no, so we don't suggest it).
function buildGapSuggestions(profile, elig) {
  const suggestions = [];
  const marks = Number(profile.marks);
  const min = Number(elig.minMarks) || 0;

  // Marks gap: "eligible if you score N% more"
  if (min && (!marks || marks < min)) {
    const need = min - (marks || 0);
    if (need <= 20) {
      suggestions.push({
        type: 'marks',
        text: `You're close! Score ${need.toFixed(1)}% more (need ≥ ${min}%) to qualify.`,
      });
    } else {
      suggestions.push({
        type: 'marks',
        text: `Needs ≥ ${min}% marks (you have ${marks || 0}%). Aim higher next exam.`,
      });
    }
  }

  // Income gap: if income is slightly above the limit, flag it.
  const income = Number(profile.income);
  const max = Number(elig.maxIncome) || 0;
  if (max && income && income > max) {
    const over = income - max;
    const pct = Math.round((over / max) * 100);
    if (pct <= 25) {
      suggestions.push({
        type: 'income',
        text: `Your family income is ₹${(over / 100000).toFixed(1)} lakh above the ₹${(max / 100000).toFixed(1)} lakh limit. Check if you qualify for an income-revision certificate.`,
      });
    } else {
      suggestions.push({
        type: 'income',
        text: `Income limit is ₹${(max / 100000).toFixed(1)} lakh (yours: ₹${(income / 100000).toFixed(1)} lakh). Look for schemes without an income cap.`,
      });
    }
  }

  // Missing profile data: encourage completion rather than "fail".
  if (min && !marks && marks !== 0) {
    suggestions.push({
      type: 'profile',
      text: 'Add your current marks to your profile — many schemes need a minimum percentage.',
    });
  }
  if (max && (!income || income <= 0)) {
    suggestions.push({
      type: 'profile',
      text: 'Add your family income to your profile to unlock income-based schemes.',
    });
  }

  return suggestions;
}

// Main entry point.
export function matchScholarships(profile, scholarships) {
  if (!profile || !Array.isArray(scholarships)) return [];

  const results = scholarships.map((sch) => {
    const elig = sch.eligibility || {};
    let earnedWeight = 0;
    const matchedCriteria = [];
    const missingCriteria = [];

    for (const [key, fn] of CHECKS) {
      const res = fn(profile, elig);
      if (res.passed) {
        earnedWeight += WEIGHTS[key];
        matchedCriteria.push(res.label);
      } else {
        missingCriteria.push(res.label);
      }
    }

    const matchScore = Math.round((earnedWeight / TOTAL_WEIGHT) * 100);
    // Actionable gap advice only for near-misses (not full misses).
    const gapSuggestions = matchScore >= 50 && matchScore < 100
      ? buildGapSuggestions(profile, elig)
      : [];
    return { scholarship: sch, matchScore, matchedCriteria, missingCriteria, gapSuggestions };
  });

  // Sort: highest match first, then soonest deadline.
  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return deadlineDelta(a.scholarship.deadline) - deadlineDelta(b.scholarship.deadline);
  });

  return results;
}

// Days from now until a deadline string (negative if past). Used for sorting.
export function deadlineDelta(deadline) {
  if (!deadline) return Number.MAX_SAFE_INTEGER;
  const d = new Date(deadline).getTime();
  if (Number.isNaN(d)) return Number.MAX_SAFE_INTEGER;
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

// Human-readable countdown, e.g. "in 12 days", "today", "2 days ago".
export function deadlineCountdown(deadline) {
  const days = deadlineDelta(deadline);
  if (days === Number.MAX_SAFE_INTEGER) return 'No deadline';
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
}
