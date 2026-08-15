import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toggleDoc, docProgress } from '../utils/docChecklistStore';

// Document Checklist — per-scholarship list of required documents the student
// can tick off as "ready". Persisted offline-first. Shown inside the
// ScholarshipCard as an expandable section.
//
// Props:
//   uid             — current user's uid
//   scholarshipId   — scholarship id
//   documents       — string[] of required document names
//   checked         — { [docName]: true } from the store
//   onCheckChange   — callback to refresh the parent's checklist state
export default function DocumentChecklist({ uid, scholarshipId, documents, checked, onCheckChange }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!documents?.length) return null;

  const { ready, total, percent } = docProgress(checked, documents);
  const isReady = percent === 100;

  const handleToggle = async (doc) => {
    if (!uid) return;
    setBusy(true);
    try {
      await toggleDoc(uid, scholarshipId, doc);
      onCheckChange?.();
    } catch (e) {
      console.error('doc toggle failed', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-medium text-slate-700"
      >
        <span className="flex items-center gap-1.5">
          {t('card.docChecklist')}
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            isReady ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {ready}/{total} {t('card.ready')}
          </span>
        </span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {/* Mini progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${isReady ? 'bg-green-500' : 'bg-brand-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {open && (
        <ul className="mt-2 space-y-1">
          {documents.map((doc) => {
            const isChecked = !!checked?.[doc];
            return (
              <li key={doc}>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300"
                    checked={isChecked}
                    disabled={busy}
                    onChange={() => handleToggle(doc)}
                  />
                  <span className={isChecked ? 'line-through text-slate-400' : ''}>{doc}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {open && isReady && (
        <p className="mt-2 text-[11px] font-medium text-green-700">
          {t('card.allDocsReady')}
        </p>
      )}
    </div>
  );
}
