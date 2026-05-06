let ctx: AudioContext | null = null

function getCtx() {
  if (typeof window === "undefined") return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

export function playChime() {
  const audio = getCtx()
  if (!audio) return

  const now = audio.currentTime
  const notes = [880, 1320, 1760]
  notes.forEach((freq, i) => {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = "sine"
    osc.frequency.value = freq
    const start = now + i * 0.18
    const dur = 0.9
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(gain).connect(audio.destination)
    osc.start(start)
    osc.stop(start + dur + 0.05)
  })
}

export function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([180, 80, 180, 80, 320])
  }
}
