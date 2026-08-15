// Source definitions for the ingestion pipeline.
// Each source has a human label, base URL, robots.txt note, and an adapter
// id. The adapter functions live in adapters.js.

export const SOURCES = [
  {
    id: 'buddy4study',
    label: 'Buddy4Study',
    baseUrl: 'https://www.buddy4study.com',
    listingUrls: ['https://www.buddy4study.com/scholarships'],
    // Buddy4Study is a Next.js SPA that loads scholarship data via a private
    // client-side API, so static scraping of the listing rarely yields parseable
    // cards. When the adapter returns no items, the orchestrator falls back to
    // the curated seed entries tagged with this source label.
    adapter: 'buddy4study',
  },
  {
    id: 'nsp',
    label: 'National Scholarship Portal',
    baseUrl: 'https://scholarships.gov.in',
    listingUrls: ['https://scholarships.gov.in/All-Scholarships'],
    // NSP renders the scheme list via JS using a session-bound .action endpoint,
    // so static scraping is unreliable. Adapter returns [] → seed fallback.
    adapter: 'nsp',
  },
  {
    id: 'ugc',
    label: 'UGC',
    baseUrl: 'https://www.ugc.gov.in',
    listingUrls: ['https://www.ugc.gov.in/'],
    adapter: 'ugc',
  },
  {
    id: 'aicte',
    label: 'AICTE',
    baseUrl: 'https://www.aicte-india.org',
    listingUrls: ['https://www.aicte-india.org/'],
    // AICTE frequently rejects non-browser clients (TLS/redirect). Adapter is
    // defensive; on failure it returns [] and seed entries are used.
    adapter: 'aicte',
  },
];

// Delay (ms) between HTTP requests to be a polite scraper and avoid IP blocks.
export const REQUEST_DELAY_MS = 1500;
