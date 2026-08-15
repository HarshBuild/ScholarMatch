// Groq-powered AI Scholarship Finder.
//
// Uses Groq's fast LLM (llama-3.3-70b) to discover ADDITIONAL scholarships a
// student may be eligible for, beyond the bundled/curated dataset. The LLM has
// broad knowledge of Indian government + private schemes (NSP, state portals,
// AICTE, UGC, CSR foundations) and returns structured JSON we can match.
//
// This complements (not replaces) the verified bundled data: AI-found results
// are clearly labelled "AI-suggested" so students know to verify them via the
// source link before applying.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an expert on Indian scholarships (government + private).
Given a student's profile, return REAL scholarships they are likely eligible for.
Use your knowledge of: National Scholarship Portal schemes, AICTE scholarships,
UGC fellowships, state government schemes (MahaDBT, Digital Gujarat, ePASS, etc.),
and private/CSR scholarships (Reliance Foundation, Tata, Aditya Birla, etc.).

Return ONLY a JSON array (no markdown, no commentary). Each item MUST have:
- name: scholarship name
- provider: government body / organisation
- description: 1-2 sentence summary
- amount: e.g. "₹12,000 per year"
- deadline: "YYYY-MM-DD" or empty string if unknown
- applyLink: official URL to apply (use real URLs you know)
- sourceUrl: official info URL
- eligibility: {
    maxIncome: number (annual ₹, or 0 if no limit),
    categories: array of ["General","OBC","SC","ST","EWS"] (empty = all),
    states: array of state names (empty = all India),
    minMarks: number (percentage, 0 if none),
    genderAllowed: array (["Male","Female"] or subset),
    disabilityRequired: boolean,
    minorityRequired: boolean
  }

Return 5-10 scholarships. Only include scholarships that genuinely exist. If unsure about a field, use an empty value rather than guessing.`;

// Find scholarships via Groq for a given student profile.
// Returns { scholarships: [], method: 'llm'|'error', error?: string }
export async function findScholarshipsWithAI(profile) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    return { scholarships: [], method: 'error', error: 'Groq API key not configured.' };
  }

  const userPrompt = `Student profile:
- Age: ${profile.age || 'unknown'}
- Gender: ${profile.gender || 'unknown'}
- State: ${profile.state || 'any'}
- Category: ${profile.category || 'unknown'}
- Annual family income: ₹${profile.income || 'unknown'}
- Education level: ${profile.educationLevel || 'unknown'}
- Course/stream: ${profile.course || 'unknown'}
- Current marks: ${profile.marks || 'unknown'}%
- Disability: ${profile.disability ? 'yes' : 'no'}
- Minority: ${profile.minority ? 'yes' : 'no'}

Find scholarships this student is eligible for. Return JSON array only.`;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const t = await res.text();
      return { scholarships: [], method: 'error', error: `Groq API error ${res.status}: ${t.slice(0, 200)}` };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    // response_format json_object wraps in an object; extract the array.
    let parsed;
    try {
      const obj = JSON.parse(content);
      parsed = Array.isArray(obj) ? obj : (obj.scholarships || obj.results || Object.values(obj)[0]);
    } catch {
      // Fallback: try to find a JSON array in the text.
      const m = content.match(/\[[\s\S]*\]/);
      parsed = m ? JSON.parse(m[0]) : [];
    }

    const scholarships = (Array.isArray(parsed) ? parsed : [])
      .filter((s) => s && s.name)
      .map((s) => ({
        id: `ai-${Math.random().toString(36).slice(2, 9)}`,
        name: s.name,
        provider: s.provider || 'AI-suggested',
        source: 'AI-suggested (Groq)',
        sourceUrl: s.sourceUrl || s.applyLink || '',
        description: s.description || '',
        amount: s.amount || '',
        deadline: s.deadline || '',
        applyLink: s.applyLink || s.sourceUrl || '',
        documentsRequired: [],
        verified: false,
        aiSuggested: true,
        eligibility: {
          minIncome: 0,
          maxIncome: Number(s.eligibility?.maxIncome) || Number.MAX_SAFE_INTEGER,
          categories: Array.isArray(s.eligibility?.categories) ? s.eligibility.categories : [],
          states: Array.isArray(s.eligibility?.states) ? s.eligibility.states : [],
          courses: [],
          minMarks: Number(s.eligibility?.minMarks) || 0,
          genderAllowed: Array.isArray(s.eligibility?.genderAllowed) ? s.eligibility.genderAllowed : [],
          disabilityRequired: !!s.eligibility?.disabilityRequired,
          minorityRequired: !!s.eligibility?.minorityRequired,
        },
      }));

    return { scholarships, method: 'llm' };
  } catch (e) {
    return { scholarships: [], method: 'error', error: e.message };
  }
}
