import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import ScholarshipCard from '../components/ScholarshipCard';
import DeadlineReminders from '../components/DeadlineReminders';
import { useAuth } from '../context/AuthContext';
import { matchScholarships } from '../utils/matchScholarships';
import { loadProfile } from '../utils/profileStore';
import { findScholarshipsWithAI } from '../utils/groqFinder';
import {
  getAllScholarships, getScholarshipMeta, getSavedScholarshipIds, setCurrentUid,
} from '../utils/scholarshipService';
import { loadApplications, setAppUid } from '../utils/applicationStore';
import { loadDocChecklists, setDocChecklistUid } from '../utils/docChecklistStore';

const SORTS = {
  match: 'dashboard.sortMatch',
  deadline: 'dashboard.sortDeadline',
  amount: 'dashboard.sortAmount',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [scholarships, setScholarships] = useState([]);
  const [meta, setMeta] = useState(null);
  const [saved, setSaved] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('match');
  const [aiScholarships, setAiScholarships] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [applications, setApplications] = useState({});
  const [docChecklists, setDocChecklists] = useState({});

  const loadApps = useCallback(async () => {
    if (!user?.uid) return;
    setAppUid(user.uid);
    try {
      setApplications(await loadApplications(user.uid));
    } catch { /* ignore */ }
  }, [user]);

  const loadDocs = useCallback(async () => {
    if (!user?.uid) return;
    setDocChecklistUid(user.uid);
    try {
      setDocChecklists(await loadDocChecklists(user.uid));
    } catch { /* ignore */ }
  }, [user]);

  const loadSaved = useCallback(async () => {
    if (!user?.uid) return;
    setCurrentUid(user.uid);
    try {
      setSaved(await getSavedScholarshipIds(user.uid));
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Profile loads local-first (instant); scholarships load bundled-first.
        const uid = user?.uid;
        const [p, schs, m] = await Promise.all([
          loadProfile(uid),
          getAllScholarships(),
          getScholarshipMeta(),
        ]);
        if (!active) return;
        // A profile counts as "completed" if it has the key fields.
        const hasProfile = p && (p.category || p.income || p.state);
        setProfile(hasProfile ? p : null);
        setScholarships(schs);
        setMeta(m);
        await loadSaved();
        await loadApps();
        await loadDocs();
      } catch (e) {
        console.error('dashboard load failed', e);
        setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user, loadSaved, loadApps, loadDocs]);

  // Run the matching engine against the loaded profile + scholarships.
  const matches = useMemo(() => {
    if (!profile) return [];
    return matchScholarships(profile, scholarships);
  }, [profile, scholarships]);

  // AI-found scholarships, also run through the matching engine.
  const aiMatches = useMemo(() => {
    if (!profile || !aiScholarships.length) return [];
    return matchScholarships(profile, aiScholarships);
  }, [profile, aiScholarships]);

  // Use Groq LLM to discover additional scholarships for this profile.
  const handleAIFind = async () => {
    if (!profile) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const { scholarships: found, error } = await findScholarshipsWithAI(profile);
      if (error) setAiError(error);
      setAiScholarships(found);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const sorted = useMemo(() => {
    const arr = [...matches];
    if (sort === 'deadline') {
      arr.sort((a, b) => {
        const da = deadlineKey(a.scholarship.deadline);
        const db_ = deadlineKey(b.scholarship.deadline);
        return da - db_;
      });
    } else if (sort === 'amount') {
      // Amount is a free-text string; sort by parsed numeric value desc.
      arr.sort((a, b) => amountNum(b.scholarship.amount) - amountNum(a.scholarship.amount));
    }
    // 'match' already sorted by matchScholarships.
    return arr;
  }, [matches, sort]);

  const fullMatches = matches.filter((m) => m.matchScore === 100).length;

  if (loading) {
    return (
      <div className="min-h-full">
        <Navbar />
        <div className="p-8 text-center text-slate-500">{t('dashboard.findingMatches')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t('dashboard.hello', { name: user?.displayName || user?.email })}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {profile
                ? t('dashboard.matchesLine', { count: fullMatches, total: matches.length })
                : t('dashboard.completeProfilePrompt')}
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
            Could not load scholarships: {error}
          </div>
        )}

        {profile && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900">{t('dashboard.yourProfile')}</h2>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  {profile.category && <span className="rounded-md bg-brand-50 px-2 py-1 font-medium text-brand-700">{profile.category}</span>}
                  {profile.state && <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">📍 {profile.state}</span>}
                  {profile.income != null && <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">💰 ₹{Number(profile.income).toLocaleString('en-IN')}</span>}
                  {profile.marks != null && <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">📊 {profile.marks}%</span>}
                  {profile.course && <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">🎓 {profile.course}</span>}
                  {profile.gender && <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">👤 {profile.gender}</span>}
                  {profile.disability && <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">♿ {t('dashboard.disability')}</span>}
                  {profile.minority && <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">{t('dashboard.minority')}</span>}
                </div>
              </div>
              <Link to="/profile" className="btn-secondary text-xs whitespace-nowrap">
                ✏️ {t('dashboard.editProfile')}
              </Link>
            </div>
            <p className="mt-2 text-xs text-slate-500">{t('dashboard.profileAlgorithmNote')}</p>
          </div>
        )}

        {profile && (
          <div className="mt-4">
            <DeadlineReminders matches={matches} saved={saved} windowDays={7} />
          </div>
        )}

        {!profile ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-3xl">📋</div>
            <h2 className="mt-3 font-semibold text-slate-900">{t('dashboard.buildProfileFirst')}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
              {t('dashboard.buildProfileBody')}
            </p>
            <Link to="/profile" className="btn-primary mt-5">{t('dashboard.completeYourProfile')}</Link>
          </div>
        ) : matches.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="mt-6 flex items-center gap-2">
              <label className="text-sm text-slate-600">{t('dashboard.sortBy')}</label>
              <select className="input max-w-xs" value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
              </select>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sorted.map((m) => (
                <ScholarshipCard
                  key={m.scholarship.id}
                  scholarship={m.scholarship}
                  match={m}
                  uid={user?.uid}
                  saved={saved}
                  onSavedChange={loadSaved}
                  application={applications[m.scholarship.id]}
                  onApplicationChange={loadApps}
                  docChecklist={docChecklists[m.scholarship.id]}
                  onDocCheckChange={loadDocs}
                />
              ))}
            </div>

            {/* AI Scholarship Finder (Groq-powered) */}
            <div className="mt-10 rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold text-indigo-900">
                    <span className="text-xl">🤖</span> {t('dashboard.aiFinderTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-indigo-700">
                    {t('dashboard.aiFinderBody')}
                  </p>
                </div>
                <button
                  onClick={handleAIFind}
                  disabled={aiLoading}
                  className="btn-primary whitespace-nowrap"
                >
                  {aiLoading ? t('dashboard.aiSearching') : t('dashboard.aiFinderBtn')}
                </button>
              </div>

              {aiError && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {aiError}
                </div>
              )}

              {aiMatches.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-indigo-700">
                    AI found {aiMatches.length} more scholarships — ranked by your match:
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {aiMatches.map((m) => (
                      <ScholarshipCard
                        key={m.scholarship.id}
                        scholarship={m.scholarship}
                        match={m}
                        uid={user?.uid}
                        saved={saved}
                        onSavedChange={loadSaved}
                        application={applications[m.scholarship.id]}
                        onApplicationChange={loadApps}
                        docChecklist={docChecklists[m.scholarship.id]}
                        onDocCheckChange={loadDocs}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    AI-suggested results are based on Groq LLM knowledge. Always verify details on the official source before applying.
                  </p>
                </div>
              )}

              {!aiLoading && aiMatches.length === 0 && !aiError && (
                <p className="mt-3 text-sm text-slate-400">
                  Click "{t('dashboard.aiFinderBtn')}" to let AI discover opportunities tailored to your profile.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="text-3xl">🔍</div>
      <h2 className="mt-3 font-semibold text-slate-900">No scholarships loaded yet</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
        Ask an admin to run data ingestion (Admin → Refresh Data) to pull the
        latest scholarships into the database.
      </p>
    </div>
  );
}

function deadlineKey(deadline) {
  if (!deadline) return Number.MAX_SAFE_INTEGER;
  const t = new Date(deadline).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function amountNum(amountStr) {
  if (!amountStr) return 0;
  const m = amountStr.match(/₹\s*([\d,]+)/);
  if (!m) return 0;
  return Number(m[1].replace(/,/g, '')) || 0;
}
