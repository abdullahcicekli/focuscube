import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], [role="menuitem"], input, textarea, select, [data-cursor="hover"]'

export function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [visible, setVisible] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const cx = useSpring(x, { stiffness: 500, damping: 38, mass: 0.4 })
  const cy = useSpring(y, { stiffness: 500, damping: 38, mass: 0.4 })

  // Skip on touch devices and reduced-motion users.
  useEffect(() => {
    const supportsHover = window.matchMedia?.("(hover: hover)").matches
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches
    setEnabled(Boolean(supportsHover && !reducedMotion))
  }, [])

  useEffect(() => {
    if (!enabled) return
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      if (!visible) setVisible(true)
      const target = e.target as HTMLElement | null
      setHovering(Boolean(target?.closest(INTERACTIVE_SELECTOR)))
    }
    const down = () => setPressed(true)
    const up = () => setPressed(false)
    const leave = () => setVisible(false)
    const enter = () => setVisible(true)

    window.addEventListener("pointermove", move, { passive: true })
    window.addEventListener("pointerdown", down)
    window.addEventListener("pointerup", up)
    document.documentElement.addEventListener("pointerleave", leave)
    document.documentElement.addEventListener("pointerenter", enter)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerdown", down)
      window.removeEventListener("pointerup", up)
      document.documentElement.removeEventListener("pointerleave", leave)
      document.documentElement.removeEventListener("pointerenter", enter)
    }
  }, [enabled, visible, x, y])

  if (!enabled) return null

  const ringScale = pressed ? 0.85 : hovering ? 1.7 : 1
  const dotScale = pressed ? 1.4 : hovering ? 0.4 : 1

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-8 w-8 rounded-full border border-white mix-blend-difference"
        style={{ x: cx, y: cy, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: ringScale, opacity: visible ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 rounded-full bg-white mix-blend-difference"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: dotScale, opacity: visible ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
      />
    </>
  )
}
