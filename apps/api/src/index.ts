import { Hono } from "hono"
import { cors } from "hono/cors"

import type { AppVariables, Bindings } from "./types"
import { sessionsRoute } from "./routes/sessions"
import { statsRoute } from "./routes/stats"

const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

app.use("*", async (c, next) => {
  const handler = cors({
    origin: c.env.WEB_ORIGIN,
    credentials: true,
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
  return handler(c, next)
})

app.get("/", (c) =>
  c.json({ name: "focuscube-api", env: c.env.ENV, ok: true })
)

app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }))

app.route("/sessions", sessionsRoute)
app.route("/stats", statsRoute)

app.notFound((c) => c.json({ error: "not_found" }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: "internal_error" }, 500)
})

export default app
