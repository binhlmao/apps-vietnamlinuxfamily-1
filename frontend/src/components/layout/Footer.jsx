import { useLocale } from '../../i18n/useLocale.jsx'
import './Footer.css'

export default function Footer() {
  const { t } = useLocale()

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <img src="/vnlf-logo.png" alt="VNLF" className="footer-logo" />
          <div>
            <p className="footer-name">{t('appName')}</p>
            <p className="footer-tagline">{t('builtFor')}</p>
          </div>
        </div>

        <div className="footer-links">
          <a href="https://vietnamlinuxfamily.net/" target="_blank" rel="noopener noreferrer">
            {t('aboutVNLF')}
          </a>
          <a href="https://www.facebook.com/groups/vietnamlinuxcommunity" target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          <a href="https://t.me/vietnamlinuxfamily" target="_blank" rel="noopener noreferrer">
            Telegram
          </a>
          <a href="https://discord.gg/gVAJDUMC2n" target="_blank" rel="noopener noreferrer">
            Discord
          </a>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Vietnam Linux Family. {t('builtFor')}.</p>
        </div>
      </div>
    </footer>
  )
}
