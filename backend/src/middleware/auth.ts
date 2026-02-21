// Auth middleware — extracts JWT from Authorization header
import { Context, Next } from 'hono'
import { verifyJWT } from '../lib/crypto'
import type { Env, JWTPayload } from '../types'

// Add user to Hono context
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload
  }
}

// Required auth — returns 401 if missing/invalid
export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = auth.slice(7)
  const payload = await verifyJWT<JWTPayload>(token, c.env.JWT_SECRET)
  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  c.set('user', payload)
  await next()
}

// Optional auth — sets user if present but doesn't require it
export async function optionalAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const auth = c.req.header('Authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7)
    const payload = await verifyJWT<JWTPayload>(token, c.env.JWT_SECRET)
    if (payload) {
      c.set('user', payload)
    }
  }
  await next()
}

// Admin-only middleware (use after requireAuth)
export async function requireAdmin(c: Context<{ Bindings: Env }>, next: Next) {
  const user = c.get('user')
  if (user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403)
  }
  await next()
}
