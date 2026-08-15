import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import ScholarshipCard from '../components/ScholarshipCard';
import { useAuth } from '../context/AuthContext';
import { getAllScholarships } from '../utils/scholarshipService';
import {
  loadApplications, setAppUid,
} from '../utils/applicationStore';
import { loadDocChecklists, setDocChecklistUid } from '../utils/docChecklistStore';
import { APPLICATION_STATUSES, APPLICATION_STATUS_STYLES } from '../utils/constants';

export default function Applications() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [scholarships, setScholarships] = useState([]);
  const [apps, setApps] = useState({});
  const [docChecklists, setDocChecklists] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadApps = useCallback(async () => {
    if (!user?.uid) return;
    setAppUid(user.uid);
    try {
      setApps(await loadApplications(user.uid));
    } catch { /* ignore */ }
  }, [user]);

  const loadDocs = useCallback(async () => {
    if (!user?.uid) return;
    setDocChecklistUid(user.uid);
    try {
      setDocChecklists(await loadDocChecklists(user.uid));
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [schs] = await Promise.all([getAllScholarships()]);
        if (!active) return;
        setScholarships(schs);
        await loadApps();
        await loadDocs();
      } catch (e) {
        setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user, loadApps, loadDocs]);

  // Map scholarshipId -> scholarship object for quick lookup.
  const byId = new Map(scholarships.map((s) => [s.id, s]));

  // Build the list of tracked applications, filtered by status.
  const tracked = Object.entries(apps)
    .map(([sid, app]) => ({ scholarship: byId.get(sid), app }))
    .filter((t) => t.scholarship)
    .filter((t) => filter === 'all' || t.app.status === filter)
    .sort((a, b) => (b.app.updatedAt || 0) - (a.app.updatedAt || 0));

  // Counts per status for the summary chips.
  const counts = APPLICATION_STATUSES.reduce((acc, st) => {
    acc[st] = Object.values(apps).filter((a) => a.status === st).length;
    return acc;
  }, {});

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
        <h1 className="text-2xl font-bold text-slate-900">{t('applications.title')}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {t('applications.subtitle')}
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Status summary chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              filter === 'all' ? 'border-slate-400 bg-slate-100 text-slate-900' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {t('applications.all')} ({tracked.length})
          </button>
          {APPLICATION_STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                filter === st
                  ? APPLICATION_STATUS_STYLES[st]
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {st} ({counts[st] || 0})
            </button>
          ))}
        </div>

        {tracked.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-3xl">📝</div>
            <h2 className="mt-3 font-semibold text-slate-900">{t('applications.empty')}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
              {t('applications.emptyBody')}
            </p>
            <Link to="/dashboard" className="btn-primary mt-5">{t('applications.findScholarships')}</Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tracked.map(({ scholarship, app }) => (
              <ScholarshipCard
                key={scholarship.id}
                scholarship={scholarship}
                uid={user?.uid}
                application={app}
                onApplicationChange={loadApps}
                docChecklist={docChecklists[scholarship.id]}
                onDocCheckChange={loadDocs}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
