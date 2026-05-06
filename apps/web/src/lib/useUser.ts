import { useEffect, useState } from "react"

import { fetchMe, type AuthUser } from "./api"

export type UserState =
  | { status: "loading"; user: null }
  | { status: "anon"; user: null }
  | { status: "authed"; user: AuthUser }

export function useUser(): {
  state: UserState
  refresh: () => Promise<void>
  setAnon: () => void
} {
  const [state, setState] = useState<UserState>({ status: "loading", user: null })

  const refresh = async () => {
    const user = await fetchMe()
    setState(user ? { status: "authed", user } : { status: "anon", user: null })
  }

  useEffect(() => {
    void refresh()
  }, [])

  const setAnon = () => setState({ status: "anon", user: null })

  return { state, refresh, setAnon }
}
