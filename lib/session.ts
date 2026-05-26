import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_COOKIE = 'session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set in .env.local')
  return secret
}

function sign(username: string): string {
  const hmac = createHmac('sha256', getSecret()).update(username).digest('hex')
  return Buffer.from(`${username}.${hmac}`).toString('base64url')
}

function verify(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const dotIndex = decoded.indexOf('.')
    if (dotIndex === -1) return null
    const username = decoded.slice(0, dotIndex)
    const providedHmac = decoded.slice(dotIndex + 1)
    const expectedHmac = createHmac('sha256', getSecret()).update(username).digest('hex')
    // Constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac))) return null
    return username
  } catch {
    return null
  }
}

export async function createSession(username: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sign(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
}

export async function getSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const username = verify(token)
  return username ? { username } : null
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
