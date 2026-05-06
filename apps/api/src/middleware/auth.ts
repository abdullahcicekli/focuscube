import { createMiddleware } from "hono/factory"

import type { AppVariables, Bindings } from "../types"
import { parseCookies } from "../lib/cookies"
import { getUserBySession, SESSION_COOKIE_NAME } from "../lib/session"

export const sessionMiddleware = createMiddleware<{
  Bindings: Bindings
  Variables: AppVariables
}>(async (c, next) => {
  const cookies = parseCookies(c.req.header("Cookie") ?? null)
  const sid = cookies[SESSION_COOKIE_NAME]
  if (sid) {
    const user = await getUserBySession(c.env.DB, sid)
    if (user) c.set("user", user)
  }
  await next()
})

export const requireAuth = createMiddleware<{
  Bindings: Bindings
  Variables: AppVariables
}>(async (c, next) => {
  if (!c.get("user")) {
    return c.json({ error: "unauthorized" }, 401)
  }
  await next()
})
