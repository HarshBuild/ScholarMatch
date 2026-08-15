import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import ProfileCompletenessMeter from '../components/ProfileCompletenessMeter';
import { useAuth } from '../context/AuthContext';
import {
  STATES, CATEGORIES, GENDERS, EDUCATION_LEVELS, COURSES, EMPTY_PROFILE,
} from '../utils/constants';
import { loadProfile, saveProfile } from '../utils/profileStore';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Load existing profile (local-first, instant; Firestore merges if available).
  useEffect(() => {
    let active = true;
    (async () => {
      const uid = user?.uid;
      const p = await loadProfile(uid);
      if (active) {
        setForm(p);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { synced, profile: savedProfile } = await saveProfile(user?.uid, form);
      // Update the in-memory user doc flag so the dashboard guard passes.
      if (user) user.profileCompleted = true;
      // Clear any stale localStorage so the dashboard re-reads the fresh profile.
      setMessage({
        type: 'success',
        text: synced
          ? t('profile.savedSuccess')
          : t('profile.savedLocal'),
      });
      // Redirect to the dashboard so the student instantly sees their matches.
      // The dashboard loads the profile via loadProfile() and runs the matching
      // engine against it — so the connection is real-time and algorithm-based.
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (err) {
      setMessage({ type: 'error', text: `${t('profile.saveError')}: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

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
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('profile.title')}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {t('profile.subtitle')}
        </p>

        <div className="mt-4">
          <ProfileCompletenessMeter profile={form} />
        </div>

        {message && (
          <div className={`mt-4 rounded-lg p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card mt-6 space-y-5">
          <Field label={t('profile.fullName')}>
            <input className="input" value={user?.displayName || ''} disabled />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('profile.age')}>
              <input type="number" min="1" max="100" className="input" required
                value={form.age} onChange={(e) => set('age', e.target.value)} />
            </Field>
            <Field label={t('profile.gender')}>
              <select className="input" required value={form.gender}
                onChange={(e) => set('gender', e.target.value)}>
                <option value="">{t('profile.select')}</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('profile.state')}>
              <select className="input" required value={form.state}
                onChange={(e) => set('state', e.target.value)}>
                <option value="">{t('profile.select')}</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label={t('profile.category')}>
              <select className="input" required value={form.category}
                onChange={(e) => set('category', e.target.value)}>
                <option value="">{t('profile.select')}</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <Field label={t('profile.income')}>
            <input type="number" min="0" step="1000" className="input" required
              placeholder="e.g. 200000"
              value={form.income} onChange={(e) => set('income', e.target.value)} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('profile.educationLevel')}>
              <select className="input" required value={form.educationLevel}
                onChange={(e) => set('educationLevel', e.target.value)}>
                <option value="">{t('profile.select')}</option>
                {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label={t('profile.course')}>
              <select className="input" required value={form.course}
                onChange={(e) => set('course', e.target.value)}>
                <option value="">{t('profile.select')}</option>
                {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <Field label={t('profile.marks')}>
            <input type="number" min="0" max="100" step="0.1" className="input" required
              value={form.marks} onChange={(e) => set('marks', e.target.value)} />
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300"
                checked={!!form.disability} onChange={(e) => set('disability', e.target.checked)} />
              {t('profile.disability')}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300"
                checked={!!form.minority} onChange={(e) => set('minority', e.target.checked)} />
              {t('profile.minority')}
            </label>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? t('profile.saving') : t('profile.save')}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
