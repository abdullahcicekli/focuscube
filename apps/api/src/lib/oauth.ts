import { GitHub, Google } from "arctic"

import type { Bindings } from "../types"

export function apiOrigin(env: Pick<Bindings, "ENV">): string {
  return env.ENV === "development"
    ? "http://localhost:8787"
    : "https://api.focuscube.app"
}

export function googleProvider(env: Bindings): Google {
  return new Google(
    requireSecret(env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID"),
    requireSecret(env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET"),
    `${apiOrigin(env)}/auth/google/callback`
  )
}

export function githubProvider(env: Bindings): GitHub {
  return new GitHub(
    requireSecret(env.GITHUB_CLIENT_ID, "GITHUB_CLIENT_ID"),
    requireSecret(env.GITHUB_CLIENT_SECRET, "GITHUB_CLIENT_SECRET"),
    `${apiOrigin(env)}/auth/github/callback`
  )
}

function requireSecret(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing required Worker secret: ${name}`)
  return value
}
