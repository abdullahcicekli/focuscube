import { Hono } from "hono"
import { cors } from "hono/cors"

import type { AppVariables, Bindings } from "./types"
import { sessionMiddleware } from "./middleware/auth"
import { authRoute } from "./routes/auth"
import { sessionsRoute } from "./routes/sessions"
import { statsRoute } from "./routes/stats"

const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

app.use("*", async (c, next) => {
  const handler = cors({
    origin: (origin) => {
      if (c.env.ENV !== "production" && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        return origin
      }
      return origin === c.env.WEB_ORIGIN ? origin : null
    },
    credentials: true,
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
  return handler(c, next)
})

app.use("*", sessionMiddleware)

app.get("/", (c) =>
  c.json({ name: "focuscube-api", env: c.env.ENV, ok: true })
)

app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }))

app.route("/auth", authRoute)
app.route("/sessions", sessionsRoute)
app.route("/stats", statsRoute)

app.notFound((c) => c.json({ error: "not_found" }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: "internal_error" }, 500)
})

export default app
