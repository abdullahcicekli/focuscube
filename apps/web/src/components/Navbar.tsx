import { HelpCircle, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

      <DropdownMenuContent className="min-w-64">
        <div className="px-2.5 pb-2 pt-2">
          <p className="truncate text-sm font-medium">{name}</p>
          {name !== email && (
            <p className="truncate text-[11px] text-muted-foreground">
              {email}
            </p>
          )}
        </div>

        <DropdownMenuSeparator />

        <div className="px-2.5 pb-1 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Your focus
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="What is a streak?"
                  className="cursor-pointer text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  <HelpCircle className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px] text-left">
                A streak counts each consecutive day you complete at least one
                focus session. Miss a day and it resets to zero.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <StatsBlock stats={statsState} />

        <DropdownMenuSeparator />

        <div className="flex justify-end px-2.5 pb-2 pt-1">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <LogOut className="size-3" />
            Sign out
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function StatsBlock({
  stats,
}: {
  stats: ReturnType<typeof useStats>["state"]
}) {
  const data = stats.stats
  const isLoading = stats.status === "loading" && !data
  const isError = stats.status === "error"
  const hasSessions = (data?.sessions ?? 0) > 0

  const display = (n: number | undefined) =>
    isLoading ? "…" : isError ? "—" : String(n ?? 0)

  return (
    <div className="mx-1 mb-1 space-y-1.5">
      <div className="grid grid-cols-3 gap-2 rounded-md border border-border/50 bg-background/40 p-2">
        <Stat label="Current" value={display(data?.streak.current)} suffix="d" />
        <Stat label="Longest" value={display(data?.streak.longest)} suffix="d" />
        <Stat
          label="Total"
          value={
            isLoading
              ? "…"
              : isError
                ? "—"
                : formatDuration(data?.seconds ?? 0)
          }
        />
      </div>
      {!isLoading && !isError && !hasSessions && (
        <p className="px-1 text-center text-[10px] leading-relaxed text-muted-foreground">
          Finish your first session to start a streak.
        </p>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix?: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="font-display text-base tabular-nums">
        {value}
        {suffix && value !== "…" && value !== "—" && (
          <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </span>
    </div>
  )
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m"
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}
