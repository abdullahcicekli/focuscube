import { Hono } from "hono"

import type { AppVariables, Bindings, ModeId } from "../types"

export const sessionsRoute = new Hono<{
  Bindings: Bindings
  Variables: AppVariables
}>()

const VALID_MODES: ReadonlySet<ModeId> = new Set(["5", "1pct", "25", "60"])

// POST /sessions — record a completed focus session.
// Auth wiring lives in the next phase; for now this returns 501 unless a
// `user` is present on the context (set by future auth middleware).
sessionsRoute.post("/", async (c) => {
  const user = c.get("user")
  if (!user) return c.json({ error: "unauthorized" }, 401)

  const body = await c.req.json<{
    modeId: ModeId
    durationSec: number
    completedAt?: number
  }>().catch(() => null)

  if (!body || !VALID_MODES.has(body.modeId) || body.durationSec <= 0) {
    return c.json({ error: "invalid_body" }, 400)
  }

  const completedAt = body.completedAt ?? Date.now()
  const date = new Date(completedAt).toISOString().slice(0, 10)
  const id = crypto.randomUUID()

  await c.env.DB.prepare(
    `INSERT INTO focus_sessions (id, user_id, mode_id, duration_sec, completed_at, date)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, user.id, body.modeId, body.durationSec, completedAt, date)
    .run()

  return c.json({ id, date }, 201)
})
