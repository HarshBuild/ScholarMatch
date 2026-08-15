// Convert messy scraped eligibility text into our structured eligibility schema:
//   { minIncome, maxIncome, categories[], states[], courses[], minMarks,
//     genderAllowed[], disabilityRequired, minorityRequired }
//
// Strategy:
//  - If GROQ_API_KEY is set, use Groq's LLM (OpenAI-compatible endpoint) to
//    extract structured JSON (per the prompt in the project brief). The model
//    is told the exact schema and instructed to return ONLY valid JSON.
//  - Otherwise, fall back to a deterministic heuristic regex parser. This keeps
//    the demo fully functional without any API key, and produces the same shape
//    of data the matching engine expects.

const DEFAULT_ELIGIBILITY = {
  minIncome: 0,
  maxIncome: Number.MAX_SAFE_INTEGER,
  categories: ['General', 'OBC', 'SC', 'ST', 'EWS'],
  states: [],
  courses: [],
  minMarks: 0,
  genderAllowed: ['Male', 'Female'],
  disabilityRequired: false,
  minorityRequired: false,
};

// Schema description embedded in the LLM prompt.
const SCHEMA = `{
  "minIncome": number,
  "maxIncome": number,
  "categories": ["General" | "OBC" | "SC" | "ST" | "EWS"],
  "states": string[],
  "courses": string[],
  "minMarks": number,
  "genderAllowed": ["Male" | "Female"],
  "disabilityRequired": boolean,
  "minorityRequired": boolean
}`;

const CATEGORY_MAP = {
  sc: 'SC',
  st: 'ST',
  obc: 'OBC',
  ews: 'EWS',
  general: 'General',
  'backward classes': 'OBC',
};

const STATE_NAMES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu and Kashmir',
];

// ── Heuristic fallback (no API key needed) ───────────────────
function heuristicExtract(text) {
  if (!text) return { ...DEFAULT_ELIGIBILITY };
  const t = text.toLowerCase();

  // Income: look for "₹X" or "rs. X" near "income" / "per annum"
  let maxIncome = DEFAULT_ELIGIBILITY.maxIncome;
  const incomeMatch =
    t.match(/(?:income|annual family income)[^.]*?(?:up to|not exceeding|less than|below|≤)?\s*₹?\s*([\d,]+)\s*(?:lakh|lac|l|per annum)?/) ||
    t.match(/₹\s*([\d,]+)\s*(?:lakh|lac|l)/) ||
    t.match(/rs\.?\s*([\d,]+)/);
  if (incomeMatch) {
    const raw = incomeMatch[1].replace(/,/g, '');
    let n = parseInt(raw, 10);
    // "8 lakh" stored as 800000
    if (/lakh|lac|\bl\b/.test(t.slice(incomeMatch.index, incomeMatch.index + 30)) && n < 100) {
      n = n * 100000;
    }
    if (n > 0) maxIncome = n;
  }

  // Categories
  const foundCats = new Set();
  for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
    const re = new RegExp(`\\b${kw}\\b`, 'i');
    if (re.test(t)) foundCats.add(cat);
  }
  const categories = foundCats.size ? [...foundCats] : DEFAULT_ELIGIBILITY.categories;

  // States (only restrict if a specific state is mentioned)
  const states = STATE_NAMES.filter((s) => t.includes(s.toLowerCase()));

  // Gender
  let genderAllowed = ['Male', 'Female'];
  if (/\bsingle girl child\b|\bgirl students?\b/i.test(t) && !/both|all gender/i.test(t)) {
    genderAllowed = ['Female'];
  } else if (/\bboys?\b/i.test(t) && !/girl/i.test(t)) {
    genderAllowed = ['Male'];
  }

  // Disability
  const disabilityRequired = /\bdisab\w+\b|\bdifferently[- ]?abled\b|\bpwd\b/i.test(t);

  // Minority
  const minorityRequired = /\bminorit/i.test(t);

  // Marks: "minimum 80%", "at least 55%", "60% marks"
  let minMarks = 0;
  const marksMatch = t.match(/(?:minimum|at least|min\.?|secured|obtained|should have)\s*(\d{1,3})\s*%/) ||
    t.match(/(\d{1,3})\s*%\s*(?:marks|in)/);
  if (marksMatch) {
    const m = parseInt(marksMatch[1], 10);
    if (m > 0 && m <= 100) minMarks = m;
  }

  return { ...DEFAULT_ELIGIBILITY, maxIncome, categories, states, genderAllowed, disabilityRequired, minorityRequired, minMarks };
}

// ── Groq LLM extraction (used when GROQ_API_KEY is set) ──────
// Groq is OpenAI-compatible, so we use the standard chat/completions endpoint.
// Model: llama-3.3-70b-versatile (fast + strong at extraction).
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function buildPrompt(eligibilityText, scholarshipName) {
  return `You are an eligibility-rule extractor for an Indian scholarship portal.

Scholarship name: ${scholarshipName || '(unknown)'}

Raw eligibility text (scraped from a website, may be messy):
"""
${eligibilityText || '(no text provided)'}
"""

Extract the eligibility rules into EXACTLY this JSON schema. Use empty arrays for
"no restriction". For "maxIncome", express the figure in rupees (e.g. 8 lakh → 800000).
For "minMarks", use a percentage 0-100 (0 if none). For "genderAllowed", use "Male"
and/or "Female". If a field is unknown, omit it or use the most permissive value.

Schema:
${SCHEMA}

Return ONLY valid JSON, no prose, no markdown fences.`;
}

async function llmExtract(eligibilityText, scholarshipName) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(30000),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0,
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: buildPrompt(eligibilityText, scholarshipName) }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  // Groq returns JSON because we set response_format json_object.
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return { ...DEFAULT_ELIGIBILITY, ...parsed };
  } catch {
    return null;
  }
}

// Public entry point.
export async function extractEligibility(eligibilityText, scholarshipName = '') {
  // Try the LLM first (only if a key is configured).
  try {
    const llm = await llmExtract(eligibilityText, scholarshipName);
    if (llm) return { eligibility: llm, method: 'llm' };
  } catch (e) {
    console.warn('[eligibility] LLM extraction failed, using heuristic:', e.message);
  }
  // Deterministic fallback — always returns a valid object.
  return { eligibility: heuristicExtract(eligibilityText), method: 'heuristic' };
}

export { DEFAULT_ELIGIBILITY };
