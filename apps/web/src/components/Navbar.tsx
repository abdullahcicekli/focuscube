import { Flame, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoginModal } from "@/components/LoginModal"
import { logout } from "@/lib/api"
import type { UserState } from "@/lib/useUser"
import { useStats } from "@/lib/useStats"

type Props = {
  state: UserState
  onSignOut: () => void
}

export function Navbar({ state, onSignOut }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
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
          <UserMenu
            name={state.user.name ?? state.user.email}
            email={state.user.email}
            avatarUrl={state.user.avatarUrl}
            onSignOut={onSignOut}
          />
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
  email,
  avatarUrl,
  onSignOut,
}: {
  name: string
  email: string
  avatarUrl: string | null
  onSignOut: () => void
}) {
  const { state: statsState, refresh } = useStats()

  const handleOpenChange = (open: boolean) => {
    if (open) void refresh()
  }

  const handleSignOut = async () => {
    await logout()
    onSignOut()
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex cursor-pointer items-center gap-2 rounded-full border border-input bg-background/40 px-2 py-1 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
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
          <span className="max-w-[140px] truncate text-xs font-medium">
            {name}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <div className="px-2.5 pb-2 pt-2">
          <p className="truncate text-sm font-medium">{name}</p>
          {name !== email && (
            <p className="truncate text-[11px] text-muted-foreground">
              {email}
            </p>
          )}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Streak</DropdownMenuLabel>
        <StreakBox stats={statsState} />

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function StreakBox({
  stats,
}: {
  stats: ReturnType<typeof useStats>["state"]
}) {
  // Keep the last-known stats visible while a refresh is in flight.
  const data = stats.stats
  const isLoading = stats.status === "loading" && !data
  const isError = stats.status === "error"

  return (
    <div className="mx-1 mb-1 grid grid-cols-3 gap-2 rounded-md border border-border/50 bg-background/40 p-2">
      <Stat
        label="Current"
        value={isLoading ? "…" : isError ? "—" : String(data?.streak.current ?? 0)}
        icon={<Flame className="size-3.5 text-orange-400" />}
      />
      <Stat
        label="Longest"
        value={isLoading ? "…" : isError ? "—" : String(data?.streak.longest ?? 0)}
      />
      <Stat
        label="Sessions"
        value={isLoading ? "…" : isError ? "—" : String(data?.sessions ?? 0)}
      />
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center gap-1 font-display text-base tabular-nums">
        {icon}
        {value}
      </span>
    </div>
  )
}

