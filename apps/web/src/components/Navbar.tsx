import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/LoginModal"
import { logout } from "@/lib/api"
import type { UserState } from "@/lib/useUser"

type Props = {
  state: UserState
  onSignOut: () => void
}

export function Navbar({ state, onSignOut }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
      <a href="/" className="flex items-center gap-2.5" aria-label="focuscube">
        <img
          src="/icon.png"
          alt=""
          width={32}
          height={32}
          className="size-8 rounded-md"
        />
        <span className="text-sm font-medium tracking-wide">focuscube</span>
      </a>

      <div className="flex items-center gap-2">
        {state.status === "authed" ? (
          <UserMenu name={state.user.name ?? state.user.email} avatarUrl={state.user.avatarUrl} onSignOut={onSignOut} />
        ) : (
          <LoginModal
            trigger={
              <Button variant="outline" size="sm" className="ml-1">
                Sign in
              </Button>
            }
          />
        )}
      </div>
    </header>
  )
}

function UserMenu({
  name,
  avatarUrl,
  onSignOut,
}: {
  name: string
  avatarUrl: string | null
  onSignOut: () => void
}) {
  const handleSignOut = async () => {
    await logout()
    onSignOut()
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-full border border-input bg-background/40 px-2 py-1">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            width={24}
            height={24}
            className="size-6 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-6 place-items-center rounded-full bg-foreground/10 text-[11px] font-medium">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="max-w-[140px] truncate text-xs font-medium">{name}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sign out"
        onClick={handleSignOut}
      >
        <LogOut />
      </Button>
    </div>
  )
}
