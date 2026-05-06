import { Hono } from "hono"
import {
  generateState,
  generateCodeVerifier,
  OAuth2RequestError,
  type OAuth2Tokens,
} from "arctic"

import type { AppVariables, Bindings } from "../types"
import { buildCookie, isProd, parseCookies, sessionCookieDomain } from "../lib/cookies"
import { githubProvider, googleProvider } from "../lib/oauth"
import {
  createSession,
  deleteSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "../lib/session"
import { upsertUserFromProvider, type ProviderName } from "../lib/users"

export const authRoute = new Hono<{
  Bindings: Bindings
  Variables: AppVariables
}>()

const STATE_COOKIE = "focuscube_oauth_state"
const VERIFIER_COOKIE = "focuscube_oauth_verifier"
const PROVIDER_COOKIE = "focuscube_oauth_provider"
const FLOW_COOKIE_TTL = 600 // 10 minutes

// --- /auth/me ----------------------------------------------------------

authRoute.get("/me", (c) => c.json({ user: c.get("user") ?? null }))

// --- /auth/logout ------------------------------------------------------

authRoute.post("/logout", async (c) => {
  const cookies = parseCookies(c.req.header("Cookie") ?? null)
  const sid = cookies[SESSION_COOKIE_NAME]
  if (sid) await deleteSession(c.env.DB, sid)

  c.header(
    "Set-Cookie",
    buildCookie(SESSION_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: isProd(c.env),
      sameSite: "Lax",
      domain: sessionCookieDomain(c.env),
    })
  )
  return c.json({ ok: true })
})

// --- /auth/google ------------------------------------------------------

authRoute.get("/google", (c) => {
  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const url = googleProvider(c.env).createAuthorizationURL(state, codeVerifier, [
    "openid",
    "email",
    "profile",
  ])
  return startResponse(c.env, url, state, codeVerifier, "google")
})

authRoute.get("/google/callback", async (c) => {
  const url = new URL(c.req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const cookies = parseCookies(c.req.header("Cookie") ?? null)
  const storedState = cookies[STATE_COOKIE]
  const codeVerifier = cookies[VERIFIER_COOKIE]
  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    return errorRedirect(c.env, "invalid_oauth_state")
  }

  let tokens: OAuth2Tokens
  try {
    tokens = await googleProvider(c.env).validateAuthorizationCode(
      code,
      codeVerifier
    )
  } catch (err) {
    return errorRedirect(c.env, oauthErrorMessage(err))
  }

  const profile = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.accessToken()}` },
  }).then((r) =>
    r.ok
      ? (r.json() as Promise<{
          sub: string
          email: string
          name?: string
          picture?: string
        }>)
      : null
  )
  if (!profile?.sub || !profile.email) {
    return errorRedirect(c.env, "google_profile_unavailable")
  }

  const { id: userId } = await upsertUserFromProvider(c.env.DB, {
    provider: "google",
    providerUserId: profile.sub,
    email: profile.email,
    name: profile.name ?? null,
    avatarUrl: profile.picture ?? null,
  })

  return finishLogin(c.env, userId)
})

// --- /auth/github ------------------------------------------------------

authRoute.get("/github", (c) => {
  const state = generateState()
  const url = githubProvider(c.env).createAuthorizationURL(state, [
    "read:user",
    "user:email",
  ])
  return startResponse(c.env, url, state, null, "github")
})

authRoute.get("/github/callback", async (c) => {
  const url = new URL(c.req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const cookies = parseCookies(c.req.header("Cookie") ?? null)
  const storedState = cookies[STATE_COOKIE]
  if (!code || !state || !storedState || state !== storedState) {
    return errorRedirect(c.env, "invalid_oauth_state")
  }

  let tokens: OAuth2Tokens
  try {
    tokens = await githubProvider(c.env).validateAuthorizationCode(code)
  } catch (err) {
    return errorRedirect(c.env, oauthErrorMessage(err))
  }

  const ghHeaders = {
    Authorization: `Bearer ${tokens.accessToken()}`,
    "User-Agent": "focuscube",
    Accept: "application/vnd.github+json",
  }

  const ghUser = await fetch("https://api.github.com/user", {
    headers: ghHeaders,
  }).then((r) =>
    r.ok
      ? (r.json() as Promise<{
          id: number
          login: string
          name: string | null
          email: string | null
          avatar_url: string | null
        }>)
      : null
  )
  if (!ghUser?.id) return errorRedirect(c.env, "github_profile_unavailable")

  let email = ghUser.email
  if (!email) {
    const emails = await fetch("https://api.github.com/user/emails", {
      headers: ghHeaders,
    }).then((r) =>
      r.ok
        ? (r.json() as Promise<
            Array<{ email: string; primary: boolean; verified: boolean }>
          >)
        : []
    )
    const primary =
      emails.find((e) => e.primary && e.verified) ??
      emails.find((e) => e.verified) ??
      emails[0]
    email = primary?.email ?? `${ghUser.id}+${ghUser.login}@users.noreply.github.com`
  }

  const { id: userId } = await upsertUserFromProvider(c.env.DB, {
    provider: "github",
    providerUserId: String(ghUser.id),
    email,
    name: ghUser.name ?? ghUser.login,
    avatarUrl: ghUser.avatar_url ?? null,
  })

  return finishLogin(c.env, userId)
})

// --- helpers -----------------------------------------------------------

function startResponse(
  env: Bindings,
  url: URL,
  state: string,
  codeVerifier: string | null,
  provider: ProviderName
): Response {
  const cookieOpts = {
    path: "/",
    httpOnly: true,
    secure: isProd(env),
    sameSite: "Lax" as const,
    maxAge: FLOW_COOKIE_TTL,
  }
  const headers = new Headers()
  headers.append("Set-Cookie", buildCookie(STATE_COOKIE, state, cookieOpts))
  if (codeVerifier) {
    headers.append("Set-Cookie", buildCookie(VERIFIER_COOKIE, codeVerifier, cookieOpts))
  }
  headers.append("Set-Cookie", buildCookie(PROVIDER_COOKIE, provider, cookieOpts))
  headers.set("Location", url.toString())
  return new Response(null, { status: 302, headers })
}

async function finishLogin(env: Bindings, userId: string): Promise<Response> {
  const session = await createSession(env.DB, userId)
  const headers = new Headers()
  const expireOpts = {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: isProd(env),
    sameSite: "Lax" as const,
  }
  headers.append("Set-Cookie", buildCookie(STATE_COOKIE, "", expireOpts))
  headers.append("Set-Cookie", buildCookie(VERIFIER_COOKIE, "", expireOpts))
  headers.append("Set-Cookie", buildCookie(PROVIDER_COOKIE, "", expireOpts))
  headers.append(
    "Set-Cookie",
    buildCookie(SESSION_COOKIE_NAME, session.id, {
      path: "/",
      httpOnly: true,
      secure: isProd(env),
      sameSite: "Lax",
      domain: sessionCookieDomain(env),
      maxAge: SESSION_TTL_SECONDS,
    })
  )
  headers.set("Location", env.WEB_ORIGIN)
  return new Response(null, { status: 302, headers })
}

function errorRedirect(env: Bindings, code: string): Response {
  const url = new URL(env.WEB_ORIGIN)
  url.searchParams.set("auth_error", code)
  return new Response(null, { status: 302, headers: { Location: url.toString() } })
}

function oauthErrorMessage(err: unknown): string {
  if (err instanceof OAuth2RequestError) return err.code || "oauth_error"
  return "oauth_error"
}
