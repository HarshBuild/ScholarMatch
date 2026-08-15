import { useTranslation } from 'react-i18next';
import { profileCompleteness } from '../utils/profileCompleteness';

// Profile Completeness Meter — shows a progress bar with the % of profile
// fields filled, plus a list of what's still missing. Mounted on the Profile
// page; updates live as the student edits the form.
export default function ProfileCompletenessMeter({ profile }) {
  const { t } = useTranslation();
  const { percent, missing } = profileCompleteness(profile);

  const colour =
    percent >= 80 ? 'bg-green-500'
    : percent >= 50 ? 'bg-amber-500'
    : 'bg-red-500';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{t('profile.completeness')}</h3>
        <span className="text-sm font-bold text-slate-900">{percent}%</span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {percent === 100
          ? t('profile.completenessDone')
          : t('profile.completenessHint')}
      </p>
      {missing.length > 0 && percent < 100 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-500">{t('profile.stillMissing')}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {missing.map((f) => (
              <span key={f.key} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {f.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
