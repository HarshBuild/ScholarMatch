import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="text-xl">🎓</span> {t('common.appName')}
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/browse" className="btn-secondary">{t('common.browse')}</Link>
          {user && <Link to="/dashboard" className="btn-secondary">{t('common.dashboard')}</Link>}
          {user && <Link to="/applications" className="btn-secondary">{t('common.applications')}</Link>}
          {user && <Link to="/profile" className="btn-secondary">{t('common.profile')}</Link>}
          {user?.role === 'admin' && <Link to="/admin" className="btn-secondary">{t('common.admin')}</Link>}
          <LanguageSwitcher />
          {user && (
            <button onClick={handleLogout} className="btn-primary">{t('common.logout')}</button>
          )}
        </nav>
      </div>
    </header>
  );
}
