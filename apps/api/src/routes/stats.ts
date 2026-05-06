import { Hono } from "hono"

import type { AppVariables, Bindings } from "../types"

export const statsRoute = new Hono<{
  Bindings: Bindings
  Variables: AppVariables
}>()

// GET /stats — totals + streak. Auth required (Phase 2 wiring).
statsRoute.get("/", async (c) => {
  const user = c.get("user")
  if (!user) return c.json({ error: "unauthorized" }, 401)

  const totalsRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS sessions, COALESCE(SUM(duration_sec), 0) AS seconds
     FROM focus_sessions WHERE user_id = ?`
  )
    .bind(user.id)
    .first<{ sessions: number; seconds: number }>()

  const distinctDates = await c.env.DB.prepare(
    `SELECT DISTINCT date FROM focus_sessions WHERE user_id = ? ORDER BY date DESC`
  )
    .bind(user.id)
    .all<{ date: string }>()

  const dates = distinctDates.results.map((r) => r.date)
  const { current, longest } = computeStreak(dates)

  return c.json({
    sessions: totalsRow?.sessions ?? 0,
    seconds: totalsRow?.seconds ?? 0,
    streak: { current, longest },
    days: dates,
  })
})

// One completion per day counts toward streak. Current streak = consecutive
// days ending today (or yesterday if today not yet logged). Longest = max
// run anywhere in history.
function computeStreak(datesDesc: string[]): {
  current: number
  longest: number
} {
  if (datesDesc.length === 0) return { current: 0, longest: 0 }

  const set = new Set(datesDesc)
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = shiftDate(today, -1)

  let current = 0
  let cursor = set.has(today) ? today : set.has(yesterday) ? yesterday : null
  while (cursor && set.has(cursor)) {
    current++
    cursor = shiftDate(cursor, -1)
  }

  let longest = 0
  let run = 0
  let prev: string | null = null
  const ascending = [...datesDesc].reverse()
  for (const d of ascending) {
    if (prev && shiftDate(prev, 1) === d) {
      run++
    } else {
      run = 1
    }
    if (run > longest) longest = run
    prev = d
  }

  return { current, longest }
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
