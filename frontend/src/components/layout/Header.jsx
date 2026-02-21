import { Link } from 'react-router-dom'
import { useLocale } from '../../i18n/useLocale.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useTheme } from '../../hooks/useTheme.jsx'
import { IconPlus, IconUser, IconLogout, IconGlobe, IconSun, IconMoon } from '../icons'
import './Header.css'

export default function Header() {
  const { t, locale, setLocale } = useLocale()
  const { user, isLoggedIn, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="header-brand">
          <img src="/vnlf-logo.png" alt="VNLF" className="header-logo" />
          <span className="header-title">{t('appName')}</span>
        </Link>

        <nav className="header-nav">
          <div className="locale-select-wrapper">
            <IconGlobe />
            <select
              className="locale-select"
              value={locale}
              onChange={e => setLocale(e.target.value)}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>

          <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>

          {isLoggedIn ? (
            <>
              <Link to="/submit" className="btn btn-ghost btn-sm">
                <IconPlus />
                <span>{t('submitApp')}</span>
              </Link>
              <div className="header-user-menu">
                <button className="header-user-btn">
                  <IconUser />
                  <span>{user.display_name}</span>
                </button>
                <div className="header-dropdown">
                  <Link to="/profile" className="header-dropdown-item">
                    <IconUser />
                    {t('profile')}
                  </Link>
                  <button onClick={logout} className="header-dropdown-item">
                    <IconLogout />
                    {t('logout')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">{t('login')}</Link>
              <Link to="/register" className="btn btn-primary btn-sm">{t('register')}</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
