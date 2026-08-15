import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { deadlineCountdown, deadlineDelta } from '../utils/matchScholarships';
import { saveScholarship, unsaveScholarship } from '../utils/scholarshipService';
import {
  setApplicationStatus, removeApplication,
} from '../utils/applicationStore';
import DocumentChecklist from './DocumentChecklist';
import {
  APPLICATION_STATUSES, APPLICATION_STATUS_STYLES,
} from '../utils/constants';

// Reusable scholarship card. `match` (optional) carries matchScore + criteria
// breakdown for the Dashboard; on Browse it's omitted.
// `application` (optional) = { status, appliedAt, updatedAt } from the tracker.
// `onApplicationChange` (optional) callback to refresh the parent's app list.
// `docChecklist` (optional) = { [docName]: true } checked documents for this card.
// `onDocCheckChange` (optional) callback to refresh the parent's checklist state.
export default function ScholarshipCard({
  scholarship, match, uid, saved, onSavedChange,
  application, onApplicationChange,
  docChecklist, onDocCheckChange,
}) {
  const [busy, setBusy] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const { t } = useTranslation();
  const s = scholarship;
  const days = deadlineDelta(s.deadline);
  const isPast = days < 0;
  const isUrgent = days >= 0 && days <= 30;
  const isSaved = saved?.has(s.id);
  const appStatus = application?.status;

  const toggleSave = async () => {
    if (!uid) return;
    setBusy(true);
    try {
      if (isSaved) await unsaveScholarship(uid, s.id);
      else await saveScholarship(uid, s.id);
      onSavedChange?.();
    } catch (e) {
      console.error('save failed', e);
    } finally {
      setBusy(false);
    }
  };

  // Application Tracker: set a status (or clear it by picking the empty option).
  const handleStatusChange = async (e) => {
    if (!uid) return;
    const value = e.target.value;
    setBusy(true);
    try {
      if (!value) {
        await removeApplication(uid, s.id);
      } else {
        await setApplicationStatus(uid, s.id, value);
      }
      onApplicationChange?.();
    } catch (err) {
      console.error('application status failed', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold leading-snug text-slate-900">{s.name}</h3>
          <p className="text-xs text-slate-500">{s.provider}</p>
        </div>
        {match && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            match.matchScore === 100 ? 'bg-green-100 text-green-700'
            : match.matchScore >= 75 ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-100 text-slate-600'
          }`}>
            {match.matchScore}% match
          </span>
        )}
      </div>

      {s.description && (
        <p className="mt-2 line-clamp-3 text-sm text-slate-600">{s.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {s.amount && (
          <span className="rounded-md bg-brand-50 px-2 py-1 font-medium text-brand-700">
            💰 {s.amount}
          </span>
        )}
        <span className={`rounded-md px-2 py-1 font-medium ${
          isPast ? 'bg-slate-100 text-slate-400'
          : isUrgent ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
        }`}>
          🗓 {s.deadline ? deadlineCountdown(s.deadline) : t('card.noDeadline')}
        </span>
        {s.source && (
          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">
            📌 {s.source}
          </span>
        )}
        {s.verified && (
          <span className="rounded-md bg-green-50 px-2 py-1 font-medium text-green-700" title="Verified from an official source">
            ✓ Verified
          </span>
        )}
      </div>

      {match && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowWhy((v) => !v)}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            {showWhy ? t('card.hideDetails') : t('card.whyMatched')}
          </button>
          {showWhy && (
            <div className="mt-2 space-y-2 text-xs">
              {match.matchedCriteria.length > 0 && (
                <ul className="space-y-0.5">
                  {match.matchedCriteria.map((c, i) => (
                    <li key={i} className="flex gap-1.5 text-green-700">
                      <span>✓</span><span>{c}</span>
                    </li>
                  ))}
                </ul>
              )}
              {match.missingCriteria.length > 0 && (
                <ul className="space-y-0.5">
                  {match.missingCriteria.map((c, i) => (
                    <li key={i} className="flex gap-1.5 text-red-600">
                      <span>✗</span><span>{c}</span>
                    </li>
                  ))}
                </ul>
              )}
              {match.gapSuggestions?.length > 0 && (
                <div className="mt-2 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-2">
                  <p className="text-xs font-semibold text-amber-800">{t('card.becomeEligible')}</p>
                  {match.gapSuggestions.map((g, i) => (
                    <p key={i} className="text-xs text-amber-700">{g.text}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {s.documentsRequired?.length > 0 && (
        <DocumentChecklist
          uid={uid}
          scholarshipId={s.id}
          documents={s.documentsRequired}
          checked={docChecklist}
          onCheckChange={onDocCheckChange}
        />
      )}

      {/* Application status badge (only when a status is tracked) */}
      {appStatus && (
        <div className="mt-3">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${APPLICATION_STATUS_STYLES[appStatus] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            📌 {appStatus}
          </span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 pt-1">
        {s.applyLink && (
          <a href={s.applyLink} target="_blank" rel="noopener noreferrer"
            className="btn-primary flex-1 text-xs">
            {t('common.applyNow')}
          </a>
        )}
        {s.sourceUrl && (
          <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-xs" title="View original source">
            {t('common.source')}
          </a>
        )}
        {uid && (
          <button type="button" onClick={toggleSave} disabled={busy}
            className={`btn-secondary text-xs ${isSaved ? 'text-brand-600' : ''}`}
            title={isSaved ? 'Saved' : 'Save'}>
            {isSaved ? '★' : '☆'}
          </button>
        )}
      </div>

      {/* Application Tracker dropdown — track this scholarship's status */}
      {uid && (
        <div className="mt-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            {t('card.trackApp')}
          </label>
          <select
            className="input text-xs"
            value={appStatus || ''}
            onChange={handleStatusChange}
            disabled={busy}
          >
            <option value="">{t('card.notApplied')}</option>
            {APPLICATION_STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
