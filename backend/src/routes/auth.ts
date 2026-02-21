// Auth routes: register, login, verify-email, forgot/reset password, me
import { Hono } from 'hono'
import { z } from 'zod'
import { generateSalt, hashPassword, verifyPassword, signJWT, generateToken } from '../lib/crypto'
import { sendEmail, verifyEmailTemplate, resetPasswordTemplate } from '../lib/email'
import { requireAuth } from '../middleware/auth'
import type { Env, User } from '../types'

const ADMIN_EMAIL = 'ledungb11@gmail.com'

const auth = new Hono<{ Bindings: Env }>()

// --- Register ---
const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  display_name: z.string().min(1).max(50),
  locale: z.enum(['vi', 'en']).optional().default('vi'),
})

auth.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  const { email, password, display_name, locale } = parsed.data

  // Check existing
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) return c.json({ error: 'Email already registered' }, 409)

  const salt = generateSalt()
  const password_hash = await hashPassword(password, salt)
  const verify_token = generateToken()
  const role = email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user'

  const id = crypto.randomUUID().replace(/-/g, '')

  await c.env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, salt, display_name, role, verify_token) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, email.toLowerCase(), password_hash, salt, display_name, role, verify_token).run()

  // Send verification email
  const verifyUrl = `${c.req.header('Origin') || 'https://apps.vietnamlinuxfamily.net'}/verify?token=${verify_token}`
  const tmpl = verifyEmailTemplate(display_name, verifyUrl, locale)
  await sendEmail(c.env.RESEND_API_KEY, { to: email, ...tmpl })

  return c.json({ message: 'Registered. Check email for verification.', id }, 201)
})

// --- Login ---
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

auth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid input' }, 400)
  const { email, password } = parsed.data

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first<User>()
  if (!user) return c.json({ error: 'Invalid email or password' }, 401)

  const valid = await verifyPassword(password, user.password_hash, user.salt)
  if (!valid) return c.json({ error: 'Invalid email or password' }, 401)

  const token = await signJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    display_name: user.display_name,
  }, c.env.JWT_SECRET)

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      role: user.role,
      email_verified: !!user.email_verified,
    },
  })
})

// --- Verify Email ---
auth.post('/verify-email', async (c) => {
  const { token } = await c.req.json<{ token: string }>()
  if (!token) return c.json({ error: 'Token required' }, 400)

  const result = await c.env.DB.prepare(
    `UPDATE users SET email_verified = 1, verify_token = NULL, updated_at = datetime('now')
     WHERE verify_token = ? AND email_verified = 0`
  ).bind(token).run()

  if (!result.meta.changes) return c.json({ error: 'Invalid or expired token' }, 400)
  return c.json({ message: 'Email verified' })
})

// --- Forgot Password ---
auth.post('/forgot-password', async (c) => {
  const { email, locale } = await c.req.json<{ email: string; locale?: 'vi' | 'en' }>()
  if (!email) return c.json({ error: 'Email required' }, 400)
  const lang = locale || 'vi'

  const user = await c.env.DB.prepare('SELECT id, display_name, email FROM users WHERE email = ?')
    .bind(email.toLowerCase()).first<User>()

  // Always return success to prevent email enumeration
  if (!user) return c.json({ message: 'If the email exists, a reset link has been sent.' })

  const reset_token = generateToken()
  const expires = new Date(Date.now() + 3600_000).toISOString() // 1 hour

  await c.env.DB.prepare(
    `UPDATE users SET reset_token = ?, reset_token_expires = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(reset_token, expires, user.id).run()

  const resetUrl = `${c.req.header('Origin') || 'https://apps.vietnamlinuxfamily.net'}/reset-password?token=${reset_token}`
  const tmpl = resetPasswordTemplate(user.display_name, resetUrl, lang)
  await sendEmail(c.env.RESEND_API_KEY, { to: user.email, ...tmpl })

  return c.json({ message: 'If the email exists, a reset link has been sent.' })
})

// --- Reset Password ---
const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6).max(100),
})

auth.post('/reset-password', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = resetSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid input' }, 400)
  const { token, password } = parsed.data

  const user = await c.env.DB.prepare(
    `SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > datetime('now')`
  ).bind(token).first<User>()

  if (!user) return c.json({ error: 'Invalid or expired token' }, 400)

  const salt = generateSalt()
  const password_hash = await hashPassword(password, salt)

  await c.env.DB.prepare(
    `UPDATE users SET password_hash = ?, salt = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(password_hash, salt, user.id).run()

  return c.json({ message: 'Password reset successful' })
})

// --- Me ---
auth.get('/me', requireAuth, async (c) => {
  const jwt = c.get('user')
  const user = await c.env.DB.prepare(
    'SELECT id, email, display_name, role, email_verified, created_at FROM users WHERE id = ?'
  ).bind(jwt.sub).first()
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json({ user })
})

export default auth
