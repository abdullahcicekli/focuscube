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
