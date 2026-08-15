// Per-source scraping adapters. Each adapter returns an array of RAW scholarship
// objects (pre-normalization):
//   { name, provider, description, eligibilityText, amount, deadline, applyLink, sourceUrl, source }
//
// All network calls go through `fetchHTML` (in fetchScholarships.js) which adds
// the User-Agent, timeout, retry and inter-request delay. Adapters only handle
// parsing, so they are easy to test and replace if a site changes.

import * as cheerio from 'cheerio';

// ── Buddy4Study ──────────────────────────────────────────────
// Tries to read the Next.js __NEXT_DATA__ JSON for embedded scholarship cards.
// Buddy4Study's listing is client-rendered, so this usually returns [] and the
// orchestrator substitutes curated seed entries for this source label.
export async function buddy4StudyAdapter(source, fetchHTML) {
  const items = [];
  for (const url of source.listingUrls) {
    const html = await fetchHTML(url);
    if (!html) continue;

    const $ = cheerio.load(html);
    // 1) Try __NEXT_DATA__ blob (some pages embed a list of scholarships).
    const nextData = $('#__NEXT_DATA__').html();
    if (nextData) {
      try {
        const json = JSON.parse(nextData);
        const walk = (node) => {
          if (Array.isArray(node)) {
            for (const it of node) {
              if (it && typeof it === 'object' && (it.title || it.scholarshipName || it.name)) {
                const title = it.title || it.scholarshipName || it.name;
                // only accept things that look like a scholarship record
                if (/scholar/i.test(title) || it.slug || it.amount || it.eligibility) {
                  items.push({
                    name: title,
                    provider: it.provider || it.instituteName || 'Buddy4Study',
                    description: it.description || it.shortDescription || '',
                    eligibilityText: JSON.stringify(it.eligibility || it.eligibilityCriteria || {}),
                    amount: it.amount || it.reward || it.amountValue || '',
                    deadline: it.deadline || it.lastDate || '',
                    applyLink: it.slug ? `https://www.buddy4study.com/scholarship/${it.slug}` : url,
                    sourceUrl: url,
                    source: source.label,
                  });
                }
              }
              walk(it);
            }
          } else if (node && typeof node === 'object') {
            for (const k of Object.keys(node)) walk(node[k]);
          }
        };
        walk(json);
      } catch {
        /* malformed __NEXT_DATA__ — ignore, fall through to HTML scraping */
      }
    }

    // 2) Fallback: look for anchor texts that look like scholarship links.
    if (!items.length) {
      $('a').each((_, el) => {
        const $a = $(el);
        const href = $a.attr('href') || '';
        const text = $a.text().trim();
        if (/scholarship/i.test(href) && text.length > 10 && text.length < 200) {
          items.push({
            name: text,
            provider: 'Buddy4Study',
            description: '',
            eligibilityText: '',
            amount: '',
            deadline: '',
            applyLink: href.startsWith('http') ? href : `https://www.buddy4study.com${href}`,
            sourceUrl: url,
            source: source.label,
          });
        }
      });
    }
  }
  return dedupe(items);
}

// ── National Scholarship Portal ──────────────────────────────
// The scheme list is JS-rendered behind a session .action endpoint, so we
// extract scheme *names* from the static HTML and link them to the NSP apply
// portal. Eligibility text is left empty (filled by seed fallback).
export async function nspAdapter(source, fetchHTML) {
  const items = [];
  for (const url of source.listingUrls) {
    const html = await fetchHTML(url);
    if (!html) continue;
    const $ = cheerio.load(html);

    // NSP embeds scheme names in various places; grab visible text and scan
    // for known scheme-name patterns, then surface them as candidate records.
    const bodyText = $('body').text().replace(/\s+/g, ' ');
    const patterns = [
      /Central Sector Scheme of Scholarships?[^.\n]*/gi,
      /Post Matric Scholarship[^.\n]*/gi,
      /Pre[- ]?Matric Scholarship[^.\n]*/gi,
      /Means[- ]?cum[- ]?Merit Scholarship[^.\n]*/gi,
      /Top Class Education Scheme[^.\n]*/gi,
    ];
    const seen = new Set();
    for (const re of patterns) {
      const m = bodyText.match(re);
      if (m) {
        const name = m[0].trim().slice(0, 180);
        if (!seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          items.push({
            name,
            provider: 'Ministry / NSP',
            description: '',
            eligibilityText: '',
            amount: '',
            deadline: '',
            applyLink: source.baseUrl + '/',
            sourceUrl: url,
            source: source.label,
          });
        }
      }
    }
  }
  return dedupe(items);
}

// ── UGC ──────────────────────────────────────────────────────
export async function ugcAdapter(source, fetchHTML) {
  const items = [];
  for (const url of source.listingUrls) {
    const html = await fetchHTML(url);
    if (!html) continue;
    const $ = cheerio.load(html);
    // UGC lists scholarship/scheme links; capture link text + href.
    $('a').each((_, el) => {
      const $a = $(el);
      const text = $a.text().trim();
      const href = $a.attr('href') || '';
      if (
        (/(scholar|fellowship|scheme)/i.test(text) || /scholar/i.test(href)) &&
        text.length > 8 &&
        text.length < 200
      ) {
        items.push({
          name: text,
          provider: 'University Grants Commission',
          description: '',
          eligibilityText: '',
          amount: '',
          deadline: '',
          applyLink: href.startsWith('http') ? href : `${source.baseUrl}${href}`,
          sourceUrl: url,
          source: source.label,
        });
      }
    });
  }
  return dedupe(items);
}

// ── AICTE ────────────────────────────────────────────────────
// Often unreachable from server-side fetchers. Defensive: returns [] on error.
export async function aicteAdapter(source, fetchHTML) {
  const items = [];
  for (const url of source.listingUrls) {
    const html = await fetchHTML(url);
    if (!html) continue;
    const $ = cheerio.load(html);
    $('a').each((_, el) => {
      const $a = $(el);
      const text = $a.text().trim();
      const href = $a.attr('href') || '';
      if (/scholar|pragati|saksham|swanath/i.test(text) && text.length < 200) {
        items.push({
          name: text,
          provider: 'AICTE',
          description: '',
          eligibilityText: '',
          amount: '',
          deadline: '',
          applyLink: href.startsWith('http') ? href : `${source.baseUrl}${href}`,
          sourceUrl: url,
          source: source.label,
        });
      }
    });
  }
  return dedupe(items);
}

const ADAPTERS = {
  buddy4study: buddy4StudyAdapter,
  nsp: nspAdapter,
  ugc: ugcAdapter,
  aicte: aicteAdapter,
};

export function getAdapter(id) {
  return ADAPTERS[id];
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((it) => {
    const key = (it.name || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
