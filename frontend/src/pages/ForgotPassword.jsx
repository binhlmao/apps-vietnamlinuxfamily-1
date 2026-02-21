import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../i18n/useLocale.jsx'
import { api } from '../lib/api'
import './Auth.css'

export default function ForgotPassword() {
  const { t, locale } = useLocale()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await api.forgotPassword(email, locale)
      setSent(true)
    } catch (err) {
      setError(err.error || (locale === 'vi' ? 'Có lỗi xảy ra' : 'Something went wrong'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: 'var(--accent)' }}>📧</h2>
          <h3>{locale === 'vi' ? 'Kiểm tra email của bạn' : 'Check your email'}</h3>
          <p className="text-muted">
            {locale === 'vi'
              ? 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.'
              : 'If the email exists in our system, you will receive a password reset link.'}
          </p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>{t('login')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <h1>{locale === 'vi' ? 'Quên mật khẩu' : 'Forgot Password'}</h1>
          <p className="text-muted">
            {locale === 'vi'
              ? 'Nhập email để nhận link đặt lại mật khẩu'
              : 'Enter your email to receive a reset link'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="input-group">
            <label>{t('email')}</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? t('loading') : (locale === 'vi' ? 'Gửi link đặt lại' : 'Send Reset Link')}
          </button>

          <p className="auth-switch">
            <Link to="/login">{locale === 'vi' ? '← Quay lại đăng nhập' : '← Back to login'}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
