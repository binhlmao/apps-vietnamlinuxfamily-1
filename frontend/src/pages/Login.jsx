import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/useLocale.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { api } from '../lib/api'
import './Auth.css'

export default function Login() {
  const { t, locale } = useLocale()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError(t('email') + ' & ' + t('password') + ' required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await api.login(email, password)
      login(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError(err.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <img src="/vnlf-logo.png" alt="VNLF" className="auth-logo" style={{ width: 48, height: 48 }} />
          <h1>{t('login')}</h1>
          <p className="text-muted">{t('appName')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="input-group">
            <label>{t('email')}</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>

          <div className="input-group">
            <label>{t('password')}</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? t('loading') : t('login')}
          </button>

          <p className="auth-switch" style={{ marginBottom: '0.25rem' }}>
            <Link to="/forgot-password">{locale === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}</Link>
          </p>

          <p className="auth-switch">
            {t('noAccount')} <Link to="/register">{t('registerNow')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
