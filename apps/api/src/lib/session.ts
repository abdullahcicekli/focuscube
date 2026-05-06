import type { AppVariables } from "../types"

export const SESSION_COOKIE_NAME = "focuscube_session"
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 60 // 60 days

export async function createSession(
  db: D1Database,
  userId: string
): Promise<{ id: string; expiresAt: number }> {
  const id = generateSessionId()
  const now = Date.now()
  const expiresAt = now + SESSION_TTL_SECONDS * 1000
  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`
    )
    .bind(id, userId, expiresAt, now)
    .run()
  return { id, expiresAt }
}

export async function getUserBySession(
  db: D1Database,
  sessionId: string
): Promise<NonNullable<AppVariables["user"]> | null> {
  const row = await db
    .prepare(
      `SELECT u.id AS id, u.email AS email, u.name AS name, u.avatar_url AS avatarUrl
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`
    )
    .bind(sessionId, Date.now())
    .first<{
      id: string
      email: string
      name: string | null
      avatarUrl: string | null
    }>()
  return row ?? null
}

export async function deleteSession(
  db: D1Database,
  sessionId: string
): Promise<void> {
  await db.prepare(`DELETE FROM sessions WHERE id = ?`).bind(sessionId).run()
}

function generateSessionId(): string {
  // 256 bits of entropy as a URL-safe base64 string.
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let str = ""
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}
