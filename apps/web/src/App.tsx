import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { GridPattern } from "@/components/ui/grid-pattern"
import { RippleButton } from "@/components/ui/ripple-button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Cursor } from "@/components/Cursor"
import { FocusCube3D } from "@/components/FocusCube3D"
import { Navbar } from "@/components/Navbar"
import { recordSession, type ModeId } from "@/lib/api"
import { playChime } from "@/lib/chime"
import type { ScreenContent } from "@/lib/screenTexture"
import { useUser } from "@/lib/useUser"

type Mode = {
  id: string
  label: string
  caption: string
  tagline: string
  sec: number
  idle: ScreenContent | "auto"
}

const MODES: ReadonlyArray<Mode> = [
  {
    id: "5",
    label: "5",
    caption: "5 min · reset",
    tagline: "5 minutes · a short break to clear your head",
    sec: 5 * 60,
    idle: "auto",
  },
  {
    id: "1pct",
    label: "1%",
    caption: "1% of your day · 14:24",
    tagline: "1% of your day = 14 min 24 sec · spend it well",
    sec: 14 * 60 + 24,
    idle: { kind: "ms", minutes: 14, seconds: 24 },
  },
  {
    id: "25",
    label: "25",
    caption: "25 min · pomodoro",
    tagline: "25 minutes · pomodoro · focus on one thing",
    sec: 25 * 60,
    idle: "auto",
  },
  {
    id: "60",
    label: "60",
    caption: "60 min · full flow",
    tagline: "60 minutes · full flow · disappear into the work",
    sec: 60 * 60,
    idle: "auto",
  },
]

const DEFAULT_INDEX = 1 // 1%

export default function App() {
  const { state: userState, setAnon } = useUser()

  const [modeIdx, setModeIdx] = useState(DEFAULT_INDEX)
  const mode = MODES[modeIdx]!

  // Cube spins gently on first load until the user grabs it once.
  const [autoRotate, setAutoRotate] = useState(
    () => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  )

  const [remainingSec, setRemainingSec] = useState(mode.sec)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [rollSignal, setRollSignal] = useState(0)
  const [rollDir, setRollDir] = useState<1 | -1 | 0>(0)
  const [modeBlockedWarning, setModeBlockedWarning] = useState(false)

  const tickRef = useRef<number | null>(null)
  const endTimeRef = useRef<number | null>(null)
  const warningTimerRef = useRef<number | null>(null)

  // Read latest auth state inside the tick closure without restarting the timer.
  const userStatusRef = useRef(userState.status)
  userStatusRef.current = userState.status

  // Tick loop (drift-corrected via endTimeRef)
  useEffect(() => {
    if (!running || paused) return
    const tick = () => {
      if (endTimeRef.current == null) return
      const left = Math.max(
        0,
        Math.round((endTimeRef.current - Date.now()) / 1000)
      )
      setRemainingSec(left)
      if (left <= 0) {
        setRunning(false)
        setPaused(false)
        endTimeRef.current = null
        playChime()
        if (userStatusRef.current === "authed") {
          void recordSession({
            modeId: mode.id as ModeId,
            durationSec: mode.sec,
          })
        }
        return
      }
      tickRef.current = window.setTimeout(tick, 250)
    }
    tickRef.current = window.setTimeout(tick, 250)
    return () => {
      if (tickRef.current) window.clearTimeout(tickRef.current)
    }
  }, [running, paused, mode])

  function changeMode(dir: 1 | -1) {
    const next = (modeIdx + dir + MODES.length) % MODES.length
    setModeIdx(next)
    setRemainingSec(MODES[next]!.sec)
    setRunning(false)
    setPaused(false)
    endTimeRef.current = null
    setRollDir(dir)
    setRollSignal((n) => n + 1)
  }

  function tryChangeMode(dir: 1 | -1) {
    if (running || paused) {
      setModeBlockedWarning(true)
      if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current)
      warningTimerRef.current = window.setTimeout(
        () => setModeBlockedWarning(false),
        2400
      )
      return
    }
    changeMode(dir)
  }

  function start() {
    if (remainingSec <= 0) return
    endTimeRef.current = Date.now() + remainingSec * 1000
    setRunning(true)
    setPaused(false)
  }
  function togglePlay() {
    if (!running) return start()
    if (paused) {
      endTimeRef.current = Date.now() + remainingSec * 1000
      setPaused(false)
    } else {
      setPaused(true)
    }
  }
  function reset() {
    setRunning(false)
    setPaused(false)
    endTimeRef.current = null
    setRemainingSec(mode.sec)
  }

  const screen: ScreenContent = (() => {
    if (running || paused) {
      const m = Math.min(99, Math.floor(remainingSec / 60))
      const s = remainingSec % 60
      return { kind: "ms", minutes: m, seconds: s }
    }
    if (mode.idle !== "auto") return mode.idle
    return { kind: "minutes", minutes: Math.min(99, Math.ceil(mode.sec / 60)) }
  })()

  return (
    <TooltipProvider>
    <Cursor />
    <div className="relative flex min-h-dvh w-full flex-col bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      >
        <GridPattern variant="default" />
      </div>

      <div className="relative z-10 flex min-h-dvh w-full flex-col">
      <Navbar state={userState} onSignOut={setAnon} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-8 px-6 py-8 lg:px-10">
        <h1 className="sr-only">
          focuscube — 1% of Your Day · Pomodoro &amp; Deep Focus Timer
        </h1>
        <section className="flex w-full flex-col items-center gap-6">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => tryChangeMode(-1)}
              aria-label="Previous mode"
              className={running || paused ? "opacity-60" : undefined}
            >
              <ChevronLeft />
            </Button>
            <div className="min-w-44 text-center">
              <div className="font-display text-2xl tabular-nums">
                {mode.label}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                {mode.caption}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => tryChangeMode(1)}
              aria-label="Next mode"
              className={running || paused ? "opacity-60" : undefined}
            >
              <ChevronRight />
            </Button>
          </div>

          <AnimatePresence>
            {modeBlockedWarning && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                role="alert"
                className="text-xs text-amber-400/90"
              >
                A focus session is running — let it finish, or reset to
                switch modes.
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-3">
            <RippleButton
              size="lg"
              className="min-w-32"
              onClick={togglePlay}
              disabled={remainingSec === 0 && !running}
            >
              {running && !paused ? (
                <>
                  <Pause /> Pause
                </>
              ) : (
                <>
                  <Play /> {paused ? "Resume" : "Start"}
                </>
              )}
            </RippleButton>
            <Button
              size="lg"
              variant="outline"
              onClick={reset}
              disabled={!running && !paused && remainingSec === mode.sec}
            >
              <RotateCcw /> Reset
            </Button>
          </div>

          <p className="max-w-md text-center text-sm leading-relaxed text-muted-foreground">
            {mode.tagline}
          </p>
        </section>

        <section
          data-cursor="drag"
          className="relative aspect-square w-full max-w-[520px]"
        >
          <FocusCube3D
            screen={screen}
            running={running}
            paused={paused}
            rollSignal={rollSignal}
            rollDir={rollDir}
            autoRotate={autoRotate}
            onUserRotate={() => setAutoRotate(false)}
          />
        </section>
      </main>

      <footer className="mx-auto w-full max-w-7xl px-6 pb-10 lg:px-10">
        <div className="flex flex-col items-center gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p className="leading-relaxed">
            A soft chime plays when the time is up.
          </p>
          <nav className="flex items-center gap-5">
            <a
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </a>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/abdullahcicekli/focuscube"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="focuscube on GitHub"
                  className="transition-colors hover:text-foreground"
                >
                  <GithubIcon />
                </a>
              </TooltipTrigger>
              <TooltipContent>GitHub repo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://www.linkedin.com/in/abdullahcicekli/"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Abdullah Çiçekli on LinkedIn"
                  className="transition-colors hover:text-foreground"
                >
                  <LinkedinIcon />
                </a>
              </TooltipTrigger>
              <TooltipContent>Abdullah Çiçekli</TooltipContent>
            </Tooltip>
          </nav>
        </div>
      </footer>
      </div>
    </div>
    </TooltipProvider>
  )
}

function GithubIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0 fill-current"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.94 10.94 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56 4.57-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

function LinkedinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0 fill-current"
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

