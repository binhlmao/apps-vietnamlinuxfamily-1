// Upload routes: icon + screenshot → R2
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import type { Env } from '../types'

const upload = new Hono<{ Bindings: Env }>()

const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

const ICON_MAX_SIZE = 200 * 1024      // 200KB
const SCREENSHOT_MAX_SIZE = 2 * 1024 * 1024 // 2MB

// --- Upload Icon ---
upload.post('/icon', requireAuth, async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const appId = formData.get('app_id') as string | null

  if (!file || !appId) return c.json({ error: 'File and app_id required' }, 400)

  // Verify app ownership
  const user = c.get('user')
  const app = await c.env.DB.prepare('SELECT user_id FROM apps WHERE id = ?').bind(appId).first()
  if (!app) return c.json({ error: 'App not found' }, 404)
  if ((app as any).user_id !== user.sub && user.role !== 'admin') {
    return c.json({ error: 'Not authorized' }, 403)
  }

  // Validate
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return c.json({ error: 'Invalid file type. Allowed: PNG, JPG, WebP, SVG' }, 400)
  if (file.size > ICON_MAX_SIZE) return c.json({ error: 'Icon max size is 200KB' }, 400)

  // Upload to R2
  const key = `icons/${appId}.${ext}`
  await c.env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  })

  const imageUrl = `${c.env.R2_PUBLIC_URL}/${key}`

  // Upsert in app_media (only 1 icon per app)
  await c.env.DB.prepare(
    `INSERT INTO app_media (id, app_id, type, image_url) VALUES (?, ?, 'icon', ?)
     ON CONFLICT(app_id) WHERE type = 'icon' 
     DO UPDATE SET image_url = excluded.image_url`
  ).bind(crypto.randomUUID().replace(/-/g, ''), appId, imageUrl).run()

  // Invalidate cache
  const appData = await c.env.DB.prepare('SELECT slug FROM apps WHERE id = ?').bind(appId).first()
  if (appData) await c.env.CACHE.delete(`app:${(appData as any).slug}`)

  return c.json({ url: imageUrl, message: 'Icon uploaded' })
})

// --- Upload Screenshot ---
upload.post('/screenshot', requireAuth, async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const appId = formData.get('app_id') as string | null
  const caption = formData.get('caption') as string | null

  if (!file || !appId) return c.json({ error: 'File and app_id required' }, 400)

  // Verify app ownership
  const user = c.get('user')
  const app = await c.env.DB.prepare('SELECT user_id FROM apps WHERE id = ?').bind(appId).first()
  if (!app) return c.json({ error: 'App not found' }, 404)
  if ((app as any).user_id !== user.sub && user.role !== 'admin') {
    return c.json({ error: 'Not authorized' }, 403)
  }

  // Check screenshot count (max 5)
  const count = await c.env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM app_media WHERE app_id = ? AND type = 'screenshot'"
  ).bind(appId).first<{ cnt: number }>()
  if (count && count.cnt >= 5) return c.json({ error: 'Maximum 5 screenshots per app' }, 400)

  // Validate
  const ext = ALLOWED_TYPES[file.type]
  if (!ext || ext === 'svg') return c.json({ error: 'Screenshots: PNG, JPG, WebP only' }, 400)
  if (file.size > SCREENSHOT_MAX_SIZE) return c.json({ error: 'Screenshot max size is 2MB' }, 400)

  // Upload to R2
  const fileId = crypto.randomUUID().replace(/-/g, '')
  const key = `screenshots/${appId}/${fileId}.${ext}`
  await c.env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  })

  const imageUrl = `${c.env.R2_PUBLIC_URL}/${key}`
  const sortOrder = (count?.cnt || 0) + 1

  await c.env.DB.prepare(
    'INSERT INTO app_media (id, app_id, type, image_url, caption, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(fileId, appId, 'screenshot', imageUrl, caption || null, sortOrder).run()

  // Invalidate cache
  const appData = await c.env.DB.prepare('SELECT slug FROM apps WHERE id = ?').bind(appId).first()
  if (appData) await c.env.CACHE.delete(`app:${(appData as any).slug}`)

  return c.json({ id: fileId, url: imageUrl, message: 'Screenshot uploaded' })
})

// --- Delete Media ---
upload.delete('/:id', requireAuth, async (c) => {
  const mediaId = c.req.param('id')
  const user = c.get('user')

  const media = await c.env.DB.prepare(
    'SELECT m.*, a.user_id as app_owner_id, a.slug as app_slug FROM app_media m JOIN apps a ON m.app_id = a.id WHERE m.id = ?'
  ).bind(mediaId).first()

  if (!media) return c.json({ error: 'Media not found' }, 404)
  if ((media as any).app_owner_id !== user.sub && user.role !== 'admin') {
    return c.json({ error: 'Not authorized' }, 403)
  }

  // Delete from R2
  const url = new URL((media as any).image_url)
  const r2Key = url.pathname.replace(/^\//, '')
  await c.env.MEDIA.delete(r2Key)

  // Delete from DB
  await c.env.DB.prepare('DELETE FROM app_media WHERE id = ?').bind(mediaId).run()
  await c.env.CACHE.delete(`app:${(media as any).app_slug}`)

  return c.json({ message: 'Media deleted' })
})

export default upload
