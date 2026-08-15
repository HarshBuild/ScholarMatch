import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const FEATURE_KEYS = ['matching', 'reminders', 'secure', 'mobile'];
const FEATURE_ICONS = { matching: '🎯', reminders: '⏰', secure: '🔒', mobile: '📱' };

// "What's New" section — lists the upgrade features for judges to see at a glance.
const WHATS_NEW = [
  { icon: '📋', title: 'Application Tracker', body: 'Track every scholarship you apply to — Applied, Under Review, Approved, or Rejected — in one place.' },
  { icon: '📊', title: 'Profile Completeness Meter', body: 'See how complete your profile is. More fields filled means more accurate scholarship matches.' },
  { icon: '⏰', title: 'Deadline Reminders', body: 'In-app alerts when a matched or saved scholarship deadline is within 7 days. Never miss one again.' },
  { icon: '📂', title: 'Document Checklist', body: 'Each scholarship shows its required documents — tick off what you have ready, with a progress bar.' },
  { icon: '💡', title: 'Eligibility Gap Suggestions', body: 'Near-miss? We tell you exactly what to improve — "Score 3% more to qualify" — not just "not eligible".' },
  { icon: '🌐', title: 'Hindi Language Support', body: 'Full Hindi UI toggle for rural students more comfortable in Hindi. More regional languages coming.' },
  { icon: '🤖', title: 'AI Scholarship Finder', body: 'Powered by Groq AI — discovers additional real scholarships across government & private portals.' },
  { icon: '📲', title: 'Offline-First PWA', body: 'Works on low bandwidth. Bundled verified scholarships load instantly, even with poor connectivity.' },
  { icon: '🔒', title: 'Secure by Design', body: 'Firestore security rules ensure students only edit their own data; only admins manage scholarships.' },
];

export default function Landing() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-full">
      <header className="bg-white/80 backdrop-blur sticky top-0 z-10 border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="text-xl">🎓</span> {t('common.appName')}
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/browse" className="btn-secondary">{t('common.browse')}</Link>
            <LanguageSwitcher />
            {user ? (
              <Link to="/dashboard" className="btn-primary">{t('common.dashboard')}</Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">{t('common.login')}</Link>
                <Link to="/signup" className="btn-primary">{t('common.signup')}</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {t('landing.badge')}
        </span>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          {t('landing.heroTitle')}{' '}
          <span className="text-brand-600">{t('landing.heroTitleHighlight')}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          {t('landing.heroSubtitle')}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/signup" className="btn-primary px-6 py-3 text-base">
            {t('landing.createProfile')}
          </Link>
          <Link to="/browse" className="btn-secondary px-6 py-3 text-base">
            {t('landing.browseScholarships')}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_KEYS.map((key) => (
            <div key={key} className="card">
              <div className="text-3xl">{FEATURE_ICONS[key]}</div>
              <h3 className="mt-3 font-semibold text-slate-900">{t(`landing.features.${key}.title`)}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{t(`landing.features.${key}.body`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What's New — surfaces the upgrade features for judges */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">✨ What's New</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-600">
            New features that make Scholarship Matcher a complete student assistant — not just a search engine.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHATS_NEW.map((item) => (
              <div key={item.title} className="card">
                <div className="text-2xl">{item.icon}</div>
                <h3 className="mt-2 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        Scholarship Matcher · Education for All
      </footer>
    </div>
  );
}
