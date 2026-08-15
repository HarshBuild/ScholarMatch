// PWA install prompt. On Android Chrome a native install banner appears;
// on iOS Safari we show instructions to "Add to Home Screen".
import { useEffect, useState } from 'react';

function isIOS() {
  return (
    typeof navigator !== 'undefined' &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !/crios|fxios/i.test(navigator.userAgent)
  );
}
function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-install-dismissed') === '1',
  );

  useEffect(() => {
    if (isInStandaloneMode()) return; // already installed
    const onBefore = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', onBefore);
    if (isIOS() && !dismissed) setShowIOS(true);
    return () => window.removeEventListener('beforeinstallprompt', onBefore);
  }, [dismissed]);

  if (isInStandaloneMode()) return null;
  const show = (deferred || showIOS) && !dismissed;
  if (!show) return null;

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    }
    dismiss();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <div className="text-2xl">📲</div>
        <div className="flex-1 text-sm">
          <p className="font-semibold text-slate-900">Install Scholarship Matcher</p>
          <p className="text-slate-600">
            {showIOS
              ? 'Tap Share → Add to Home Screen to use it like an app.'
              : 'Add it to your home screen for quick offline access.'}
          </p>
        </div>
        {!showIOS && (
          <button onClick={install} className="btn-primary px-3 py-2">
            Install
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
