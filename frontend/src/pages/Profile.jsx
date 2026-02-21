import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/useLocale.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { api } from '../lib/api'
import { IconUser, IconShield } from '../components/icons'
import StarRating from '../components/app/StarRating'
import './Profile.css'

export default function Profile() {
  const { t, locale } = useLocale()
  const { user, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()
  const [myApps, setMyApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) return
    // Fetch user's apps by querying all apps and filtering client-side
    // (In production, add a /api/users/:id/apps endpoint)
    api.getApps({ limit: '50' })
      .then(data => {
        const userApps = (data.apps || []).filter(a => a.user_id === user.id)
        setMyApps(userApps)
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [isLoggedIn, user])

  if (!isLoggedIn) {
    return (
      <div className="profile">
        <div className="container">
          <div className="submit-login-prompt">
            <h2>{t('loginToReview')}</h2>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>{t('login')}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="profile">
      <div className="container">
        <div className="profile-header card">
          <div className="profile-avatar" style={{ background: `hsl(${Math.abs([...user.display_name].reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0) % 360)}, 45%, 45%)` }}>
            {user.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="profile-info">
            <h1>{user.display_name}</h1>
            <p className="text-muted">{user.email}</p>
            <div className="profile-badges">
              {user.role === 'admin' && (
                <span className="badge badge-verified"><IconShield style={{ width: 14, height: 14 }} /> Admin</span>
              )}
              {user.email_verified && (
                <span className="badge badge-verified">{t('verified')}</span>
              )}
            </div>
          </div>
        </div>

        <section className="profile-section">
          <div className="section-title">
            <h2>{t('myApps')}</h2>
            <Link to="/submit" className="btn btn-primary btn-sm">{t('submitApp')}</Link>
          </div>
          {loading ? (
            <p>{t('loading')}</p>
          ) : myApps.length > 0 ? (
            <div className="profile-apps-grid">
              {myApps.map(app => (
                <Link key={app.id} to={`/app/${app.slug}`} className="profile-app-item card card-flat">
                  <h4>{app.name}</h4>
                  <p>{app.short_desc}</p>
                  <div className="profile-app-meta">
                    <StarRating rating={app.avg_rating || 0} />
                    <span className="text-muted">{app.review_count || 0} {t('reviews').toLowerCase()}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>{locale === 'vi' ? 'Bạn chưa đăng ứng dụng nào' : 'You haven\'t submitted any apps yet'}</p>
              <Link to="/submit" className="btn btn-primary">{t('submitApp')}</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
