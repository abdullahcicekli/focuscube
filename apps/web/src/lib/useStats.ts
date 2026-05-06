import { useCallback, useState } from "react"

import { fetchStats, type Stats } from "./api"

export type StatsState =
  | { status: "idle"; stats: null }
  | { status: "loading"; stats: Stats | null }
  | { status: "ready"; stats: Stats }
  | { status: "error"; stats: null }

export function useStats() {
  const [state, setState] = useState<StatsState>({
    status: "idle",
    stats: null,
  })

  const refresh = useCallback(async () => {
    setState((prev) => ({ status: "loading", stats: prev.stats }))
    const stats = await fetchStats()
    if (stats) {
      setState({ status: "ready", stats })
    } else {
      setState({ status: "error", stats: null })
    }
  }, [])

  return { state, refresh }
}
