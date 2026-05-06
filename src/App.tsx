import { useEffect, useRef, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { FocusCube3D } from "@/components/FocusCube3D"
import { Navbar } from "@/components/Navbar"
import { playChime } from "@/lib/chime"
import type { ScreenContent } from "@/lib/screenTexture"

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
  const [modeIdx, setModeIdx] = useState(DEFAULT_INDEX)
  const mode = MODES[modeIdx]!

  const [remainingSec, setRemainingSec] = useState(mode.sec)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [rollSignal, setRollSignal] = useState(0)
  const [rollDir, setRollDir] = useState<1 | -1 | 0>(0)

  const tickRef = useRef<number | null>(null)
  const endTimeRef = useRef<number | null>(null)

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
        return
      }
      tickRef.current = window.setTimeout(tick, 250)
    }
    tickRef.current = window.setTimeout(tick, 250)
    return () => {
      if (tickRef.current) window.clearTimeout(tickRef.current)
    }
  }, [running, paused])

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
    <div className="min-h-dvh w-full bg-background">
      <Navbar />

      <main className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 pb-16">
        <h1 className="sr-only">
          focuscube — 1% of Your Day · Pomodoro &amp; Deep Focus Timer
        </h1>
        <section className="flex w-full flex-col items-center gap-6">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeMode(-1)}
              disabled={running || paused}
              aria-label="Previous mode"
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
              onClick={() => changeMode(1)}
              disabled={running || paused}
              aria-label="Next mode"
            >
              <ChevronRight />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
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
            </Button>
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

        <section className="relative aspect-square w-full max-w-[520px]">
          <FocusCube3D
            screen={screen}
            running={running}
            paused={paused}
            rollSignal={rollSignal}
            rollDir={rollDir}
          />
        </section>
      </main>

      <footer className="mx-auto w-full max-w-md px-6 pb-10 text-center text-xs leading-relaxed text-muted-foreground">
        A soft chime plays when the time is up.
      </footer>
    </div>
  )
}

