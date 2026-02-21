// VNLF App Explorer API — Main Entry
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { Env } from './types'

import authRoutes from './routes/auth'
import appsRoutes from './routes/apps'
import reviewsRoutes from './routes/reviews'
import uploadRoutes from './routes/upload'
import categoriesRoutes from './routes/categories'

const app = new Hono<{ Bindings: Env }>()

// Global middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://apps.vietnamlinuxfamily.net'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
}))

// Health check
app.get('/', (c) => c.json({
  name: 'VNLF App Explorer API',
  version: '1.0.0',
  status: 'ok',
}))

// Mount routes
app.route('/api/auth', authRoutes)
app.route('/api/apps', appsRoutes)
app.route('/api', reviewsRoutes)        // /api/apps/:id/reviews, /api/reviews/:id/...
app.route('/api/upload', uploadRoutes)
app.route('/api/categories', categoriesRoutes)

// Serve R2 files (local dev — in production use R2 custom domain)
app.get('/r2/*', async (c) => {
  const key = c.req.path.replace('/r2/', '')
  const object = await c.env.MEDIA.get(key)
  if (!object) return c.json({ error: 'File not found' }, 404)

  const headers = new Headers()
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
  headers.set('Cache-Control', 'public, max-age=3600')
  return new Response(object.body, { headers })
})

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
