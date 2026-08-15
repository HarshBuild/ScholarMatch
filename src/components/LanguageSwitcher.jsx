import { useTranslation } from 'react-i18next';

// Language switcher — toggles between English and Hindi.
// The choice persists (see i18n/index.js languageChanged listener).
// Mobile-first: a compact button, not a bulky dropdown.
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';

  const toggle = () => {
    i18n.changeLanguage(isHindi ? 'en' : 'hi');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-secondary text-xs"
      title={isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
      aria-label="Toggle language"
    >
      {isHindi ? 'EN' : 'हिं'}
    </button>
  );
}
