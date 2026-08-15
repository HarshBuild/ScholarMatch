import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { deadlineCountdown, deadlineDelta } from '../utils/matchScholarships';

// In-app Deadline Reminders.
//
// Surfaces scholarships whose deadline is within `windowDays` (default 7),
// pulled from the student's matched scholarships. Shown as a dismissible-
// style banner + a list with urgency colours. This is the "rural student
// never misses a deadline" angle — a Cloud Function email/SMS layer can
// reuse the same deadlineDelta logic (see README Future Scope).
//
// Props:
//   matches   — [{ scholarship, matchScore, ... }] from the matching engine
//   saved      — Set of saved scholarship ids (reminders include saved too)
//   windowDays — number, default 7
export default function DeadlineReminders({ matches = [], saved, windowDays = 7 }) {
  const upcoming = useMemo(() => {
    const savedSet = saved || new Set();
    return matches
      .filter((m) => {
        const days = deadlineDelta(m.scholarship.deadline);
        // Only future deadlines, within the window.
        return days >= 0 && days <= windowDays;
      })
      .sort((a, b) => deadlineDelta(a.scholarship.deadline) - deadlineDelta(b.scholarship.deadline));
  }, [matches, saved, windowDays]);

  if (upcoming.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">⏰</span>
        <h2 className="text-sm font-semibold text-red-900">
          Deadline reminders — {upcoming.length} scholarship{upcoming.length > 1 ? 's' : ''} closing soon
        </h2>
      </div>
      <ul className="mt-3 space-y-2">
        {upcoming.map((m) => {
          const days = deadlineDelta(m.scholarship.deadline);
          const isToday = days === 0;
          const isTomorrow = days === 1;
          const urgency = isToday || isTomorrow ? 'text-red-700' : 'text-amber-700';
          return (
            <li key={m.scholarship.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-100 bg-white px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{m.scholarship.name}</p>
                <p className="text-xs text-slate-500">{m.scholarship.provider}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${urgency}`}>
                  {isToday ? '⚠️ Today!' : isTomorrow ? '⚠️ Tomorrow!' : deadlineCountdown(m.scholarship.deadline)}
                </span>
                {m.scholarship.applyLink && (
                  <a href={m.scholarship.applyLink} target="_blank" rel="noopener noreferrer"
                     className="btn-primary text-xs">
                    Apply ↗
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Tip: bookmark scholarships and track your application status on the{' '}
        <Link to="/applications" className="font-medium text-brand-600 hover:underline">Applications</Link> page.
      </p>
    </div>
  );
}
