// PBKDF2 + JWT utilities using Web Crypto API (no external deps)

const PBKDF2_ITERATIONS = 100_000
const KEY_LENGTH = 32 // bytes
const SALT_LENGTH = 16 // bytes

// Generate random salt
export function generateSalt(): string {
  const salt = new Uint8Array(SALT_LENGTH)
  crypto.getRandomValues(salt)
  return bufToHex(salt)
}

// Generate random token (for email verify / reset)
export function generateToken(): string {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  return bufToHex(buf)
}

// Hash password with PBKDF2-SHA256
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBuf(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key, KEY_LENGTH * 8
  )
  return bufToHex(new Uint8Array(bits))
}

// Verify password
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const computed = await hashPassword(password, salt)
  return computed === hash
}

// Sign JWT (HMAC-SHA256)
export async function signJWT(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 7 * 24 * 3600 // 7 days
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds }

  const enc = new TextEncoder()
  const headerB64 = base64url(JSON.stringify(header))
  const payloadB64 = base64url(JSON.stringify(fullPayload))
  const signingInput = `${headerB64}.${payloadB64}`

  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput))
  const sigB64 = base64url(new Uint8Array(sig))

  return `${signingInput}.${sigB64}`
}

// Verify JWT
export async function verifyJWT<T = Record<string, unknown>>(
  token: string,
  secret: string
): Promise<T | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, sigB64] = parts
    const signingInput = `${headerB64}.${payloadB64}`
    const enc = new TextEncoder()

    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    const sig = base64urlDecode(sigB64)
    const valid = await crypto.subtle.verify('HMAC', key, sig, enc.encode(signingInput))
    if (!valid) return null

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64))) as T & { exp?: number }
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

// --- Helpers ---

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('')
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function base64url(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  const b64 = btoa(String.fromCharCode(...bytes))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (input.length % 4)) % 4)
  const bstr = atob(padded)
  return Uint8Array.from(bstr, c => c.charCodeAt(0))
}
