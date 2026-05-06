export type Bindings = {
  DB: D1Database
  WEB_ORIGIN: string
  ENV: "development" | "production"
  // Secrets (set via `wrangler secret put`):
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  SESSION_SECRET?: string
}

export type AppVariables = {
  user?: {
    id: string
    email: string
    name: string | null
    avatarUrl: string | null
  }
}

export type ModeId = "5" | "1pct" | "25" | "60"
