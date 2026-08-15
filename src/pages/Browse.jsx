import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import ScholarshipCard from '../components/ScholarshipCard';
import { useAuth } from '../context/AuthContext';
import {
  getAllScholarships, getScholarshipMeta, getSavedScholarshipIds,
} from '../utils/scholarshipService';
import { loadApplications, setAppUid } from '../utils/applicationStore';
import { loadDocChecklists, setDocChecklistUid } from '../utils/docChecklistStore';
import { STATES, CATEGORIES } from '../utils/constants';

export default function Browse() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [scholarships, setScholarships] = useState([]);
  const [meta, setMeta] = useState(null);
  const [saved, setSaved] = useState(new Set());
  const [applications, setApplications] = useState({});
  const [docChecklists, setDocChecklists] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [state, setState] = useState('');
  const [category, setCategory] = useState('');

  const loadSaved = useCallback(async () => {
    if (!user?.uid) return;
    try { setSaved(await getSavedScholarshipIds(user.uid)); } catch { /* ignore */ }
  }, [user]);

  const loadApps = useCallback(async () => {
    if (!user?.uid) return;
    setAppUid(user.uid);
    try { setApplications(await loadApplications(user.uid)); } catch { /* ignore */ }
  }, [user]);

  const loadDocs = useCallback(async () => {
    if (!user?.uid) return;
    setDocChecklistUid(user.uid);
    try { setDocChecklists(await loadDocChecklists(user.uid)); } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [schs, m] = await Promise.all([getAllScholarships(), getScholarshipMeta()]);
        if (!active) return;
        setScholarships(schs);
        setMeta(m);
        await loadSaved();
        await loadApps();
        await loadDocs();
      } catch (e) {
        console.error('browse load failed', e);
        setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user, loadSaved, loadApps, loadDocs]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return scholarships.filter((s) => {
      if (term) {
        const hay = `${s.name} ${s.provider} ${s.description || ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (state) {
        const st = s.eligibility?.states || [];
        if (st.length && !st.includes(state)) return false;
      }
      if (category) {
        const cats = s.eligibility?.categories || [];
        if (cats.length && !cats.includes(category)) return false;
      }
      return true;
    });
  }, [scholarships, q, state, category]);

  if (loading) {
    return (
      <div className="min-h-full">
        <Navbar />
        <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('browse.title')}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {t('browse.subtitle')}
            </p>
          </div>
          {meta?.lastUpdated && (
            <p className="text-xs text-slate-400">
              {t('dashboard.dataUpdated', { date: new Date(meta.lastUpdated).toLocaleString() })}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Could not load: {error}
          </div>
        )}

        <div className="card mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input className="input" placeholder={t('browse.searchPlaceholder')}
            value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">{t('browse.allStates')}</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t('browse.allCategories')}</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          {t('browse.showing', { shown: filtered.length, total: scholarships.length })}
        </p>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            {t('browse.noResults')}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <ScholarshipCard
                key={s.id}
                scholarship={s}
                uid={user?.uid}
                saved={saved}
                onSavedChange={loadSaved}
                application={applications[s.id]}
                onApplicationChange={loadApps}
                docChecklist={docChecklists[s.id]}
                onDocCheckChange={loadDocs}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
