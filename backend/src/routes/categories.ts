// Categories route with KV caching
import { Hono } from 'hono'
import type { Env } from '../types'

const categories = new Hono<{ Bindings: Env }>()

categories.get('/', async (c) => {
  // Try cache first (1 hour TTL)
  const cached = await c.env.CACHE.get('categories', 'json')
  if (cached) return c.json(cached)

  const result = await c.env.DB.prepare(
    'SELECT * FROM categories ORDER BY id'
  ).all()

  const data = result.results || []

  // Cache for 1 hour
  await c.env.CACHE.put('categories', JSON.stringify(data), { expirationTtl: 3600 })

  return c.json(data)
})

export default categories
