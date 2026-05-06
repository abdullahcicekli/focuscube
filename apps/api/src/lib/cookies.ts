import type { Bindings } from "../types"

export type CookieOptions = {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: "Strict" | "Lax" | "None"
  domain?: string
  path?: string
  maxAge?: number
}

export function buildCookie(
  name: string,
  value: string,
  opts: CookieOptions = {}
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  if (opts.path) parts.push(`Path=${opts.path}`)
  if (opts.domain) parts.push(`Domain=${opts.domain}`)
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`)
  if (opts.httpOnly) parts.push("HttpOnly")
  if (opts.secure) parts.push("Secure")
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`)
  return parts.join("; ")
}

export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {}
  const out: Record<string, string> = {}
  for (const part of header.split(";")) {
    const idx = part.indexOf("=")
    if (idx < 0) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    if (!k) continue
    try {
      out[k] = decodeURIComponent(v)
    } catch {
      out[k] = v
    }
  }
  return out
}

export function isProd(env: Pick<Bindings, "ENV">): boolean {
  return env.ENV === "production"
}

// Sharing the session cookie across focuscube.app (web) and api.focuscube.app
// (worker) is the whole reason for an explicit Domain in production.
// Locally we omit it so the cookie scopes to host:port only.
export function sessionCookieDomain(
  env: Pick<Bindings, "ENV">
): string | undefined {
  return isProd(env) ? "focuscube.app" : undefined
}
