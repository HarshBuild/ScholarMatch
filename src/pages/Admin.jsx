import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { db, app } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { CATEGORIES } from '../utils/constants';
import {
  getAllScholarships, createScholarship, updateScholarship, deleteScholarship, getScholarshipMeta,
} from '../utils/scholarshipService';
import {
  collection, writeBatch, doc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const EMPTY = {
  name: '', provider: '', description: '', amount: '', deadline: '',
  applyLink: '', sourceUrl: '', source: '', documentsRequired: '',
  maxIncome: '', minMarks: '', categories: '', states: '',
  genderAllowed: 'Male,Female', disabilityRequired: false, minorityRequired: false,
};

export default function Admin() {
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState(null);
  const [editing, setEditing] = useState(null); // scholarship being edited or null
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [schs, m] = await Promise.all([getAllScholarships(), getScholarshipMeta()]);
      setList(schs);
      setMeta(m);
    } catch (e) {
      console.error('admin load failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Trigger the Cloud Function that ingests fresh data from the internet.
  // Falls back to seeding the curated JSON directly if the function isn't
  // deployed yet (so the demo always works).
  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const functions = getFunctions(app, 'us-central1');
      const fn = httpsCallable(functions, 'refreshScholarships');
      const res = await fn();
      setRefreshMsg({
        type: 'success',
        text: `✅ Live ingestion done! Added ${res.data.added}, updated ${res.data.updated} in ${(res.data.durationMs / 1000).toFixed(1)}s.`,
      });
      await load();
    } catch (e) {
      console.warn('Cloud function unavailable, seeding directly:', e.message);
      try {
        const count = await seedFromJSON();
        setRefreshMsg({
          type: 'success',
          text: `⚠️ Cloud Function not deployed. Seeded ${count} real scholarships from the curated dataset directly. (Deploy functions for live internet ingestion.)`,
        });
        await load();
      } catch (e2) {
        setRefreshMsg({ type: 'error', text: `Failed: ${e2.message}` });
      }
    } finally {
      setRefreshing(false);
    }
  };

  const startEdit = (s) => {
    setEditing(s.id);
    setForm({
      name: s.name || '',
      provider: s.provider || '',
      description: s.description || '',
      amount: s.amount || '',
      deadline: s.deadline || '',
      applyLink: s.applyLink || '',
      sourceUrl: s.sourceUrl || '',
      source: s.source || '',
      documentsRequired: (s.documentsRequired || []).join(', '),
      maxIncome: s.eligibility?.maxIncome && s.eligibility.maxIncome !== Number.MAX_SAFE_INTEGER ? String(s.eligibility.maxIncome) : '',
      minMarks: s.eligibility?.minMarks ? String(s.eligibility.minMarks) : '',
      categories: (s.eligibility?.categories || []).join(', '),
      states: (s.eligibility?.states || []).join(', '),
      genderAllowed: (s.eligibility?.genderAllowed || ['Male', 'Female']).join(','),
      disabilityRequired: !!s.eligibility?.disabilityRequired,
      minorityRequired: !!s.eligibility?.minorityRequired,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => { setEditing(null); setForm(EMPTY); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const doc_ = {
      name: form.name.trim(),
      provider: form.provider.trim(),
      description: form.description.trim(),
      amount: form.amount.trim(),
      deadline: form.deadline,
      applyLink: form.applyLink.trim(),
      sourceUrl: form.sourceUrl.trim(),
      source: form.source.trim() || 'Admin',
      documentsRequired: splitList(form.documentsRequired),
      eligibility: {
        minIncome: 0,
        maxIncome: form.maxIncome ? Number(form.maxIncome) : Number.MAX_SAFE_INTEGER,
        categories: splitList(form.categories).length ? splitList(form.categories) : CATEGORIES,
        states: splitList(form.states),
        courses: [],
        minMarks: form.minMarks ? Number(form.minMarks) : 0,
        genderAllowed: splitList(form.genderAllowed),
        disabilityRequired: !!form.disabilityRequired,
        minorityRequired: !!form.minorityRequired,
      },
    };
    try {
      if (editing) await updateScholarship(editing, doc_);
      else await createScholarship(doc_);
      resetForm();
      await load();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteScholarship(id);
      await load();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin panel</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage scholarships and refresh live data from the internet.
            </p>
          </div>
          {meta?.lastUpdated && (
            <p className="text-xs text-slate-400">
              Data last updated: {new Date(meta.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {/* Refresh Data — calls the Cloud Function */}
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Refresh scholarship data</h2>
            <p className="text-sm text-slate-600">
              Pulls fresh scholarships from NSP, UGC, AICTE &amp; Buddy4Study using
              Groq LLM for eligibility extraction.
            </p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} className="btn-primary">
            {refreshing ? 'Refreshing… (this can take ~30s)' : '🔄 Refresh Data'}
          </button>
        </div>
        {refreshMsg && (
          <div className={`mt-3 rounded-lg p-3 text-sm ${
            refreshMsg.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {refreshMsg.text}
          </div>
        )}

        {/* Add / Edit form */}
        <div className="card mt-6">
          <h2 className="font-semibold text-slate-900">
            {editing ? 'Edit scholarship' : 'Add scholarship'}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Name"><input className="input" required value={form.name} onChange={(e)=>set('name',e.target.value)} /></F>
              <F label="Provider"><input className="input" required value={form.provider} onChange={(e)=>set('provider',e.target.value)} /></F>
            </div>
            <F label="Description"><textarea className="input" rows={2} value={form.description} onChange={(e)=>set('description',e.target.value)} /></F>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <F label="Amount"><input className="input" value={form.amount} onChange={(e)=>set('amount',e.target.value)} /></F>
              <F label="Deadline"><input type="date" className="input" value={form.deadline} onChange={(e)=>set('deadline',e.target.value)} /></F>
              <F label="Source"><input className="input" value={form.source} onChange={(e)=>set('source',e.target.value)} /></F>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Apply link"><input className="input" value={form.applyLink} onChange={(e)=>set('applyLink',e.target.value)} /></F>
              <F label="Source URL"><input className="input" value={form.sourceUrl} onChange={(e)=>set('sourceUrl',e.target.value)} /></F>
            </div>
            <F label="Documents required (comma-separated)">
              <input className="input" value={form.documentsRequired} onChange={(e)=>set('documentsRequired',e.target.value)} />
            </F>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-500">ELIGIBILITY RULES</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <F label="Max income (₹, blank = no limit)"><input type="number" className="input" value={form.maxIncome} onChange={(e)=>set('maxIncome',e.target.value)} /></F>
                <F label="Min marks (%)"><input type="number" className="input" value={form.minMarks} onChange={(e)=>set('minMarks',e.target.value)} /></F>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <F label="Categories (comma-separated, blank = all)"><input className="input" value={form.categories} onChange={(e)=>set('categories',e.target.value)} /></F>
                <F label="States (comma-separated, blank = all)"><input className="input" value={form.states} onChange={(e)=>set('states',e.target.value)} /></F>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <F label="Gender allowed (comma-separated)"><input className="input" value={form.genderAllowed} onChange={(e)=>set('genderAllowed',e.target.value)} /></F>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="h-4 w-4" checked={form.disabilityRequired} onChange={(e)=>set('disabilityRequired',e.target.checked)} /> Disability required
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="h-4 w-4" checked={form.minorityRequired} onChange={(e)=>set('minorityRequired',e.target.checked)} /> Minority required
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update scholarship' : 'Add scholarship'}
              </button>
              {editing && <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>}
            </div>
          </form>
        </div>

        {/* List */}
        <h2 className="mt-8 font-semibold text-slate-900">All scholarships ({list.length})</h2>
        {loading ? (
          <p className="mt-2 text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Provider</th>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3">Deadline</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-800">{s.name}</td>
                    <td className="py-2 pr-3 text-slate-600">{s.provider}</td>
                    <td className="py-2 pr-3 text-slate-600">{s.source || '—'}</td>
                    <td className="py-2 pr-3 text-slate-600">{s.deadline || '—'}</td>
                    <td className="py-2 pr-3">
                      <button onClick={() => startEdit(s)} className="text-brand-600 hover:underline">Edit</button>
                      <span className="px-1 text-slate-300">|</span>
                      <button onClick={() => handleDelete(s.id, s.name)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function F({ label, children }) {
  return <div><label className="label">{label}</label>{children}</div>;
}

function splitList(str) {
  return (str || '').split(',').map((x) => x.trim()).filter(Boolean);
}

// Seed the Firestore `scholarships` collection directly from the curated JSON.
// Used as a fallback when the Cloud Function isn't deployed.
async function seedFromJSON() {
  const res = await fetch('/seed-scholarships.json');
  if (!res.ok) throw new Error('Could not load seed JSON');
  const seed = await res.json();
  const batch = writeBatch(db);
  for (const s of seed) {
    const ref = doc(collection(db, COLLECTIONS.SCHOLARSHIPS));
    batch.set(ref, { ...s, lastUpdated: Date.now() });
  }
  // Write meta doc.
  const metaRef = doc(db, 'scholarshipMeta', 'latest');
  batch.set(metaRef, {
    lastUpdated: Date.now(),
    count: seed.length,
    sources: [{ label: 'Curated seed (direct)' , count: seed.length, usedFallback: true }],
    errors: [],
  });
  await batch.commit();
  return seed.length;
}
