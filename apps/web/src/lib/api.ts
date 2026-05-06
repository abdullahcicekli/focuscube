export const API_BASE =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8787"
    : "https://api.focuscube.app"

export type AuthUser = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
}

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" })
  if (!res.ok) return null
  const body = (await res.json()) as { user: AuthUser | null }
  return body.user
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  })
}

export const oauthStartUrl = (provider: "google" | "github") =>
  `${API_BASE}/auth/${provider}`

export type ModeId = "5" | "1pct" | "25" | "60"

export type Stats = {
  sessions: number
  seconds: number
  streak: { current: number; longest: number }
  days: string[]
}

export async function fetchStats(): Promise<Stats | null> {
  const res = await fetch(`${API_BASE}/stats`, { credentials: "include" })
  if (!res.ok) return null
  return (await res.json()) as Stats
}

export async function recordSession(input: {
  modeId: ModeId
  durationSec: number
}): Promise<boolean> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  return res.ok
}
