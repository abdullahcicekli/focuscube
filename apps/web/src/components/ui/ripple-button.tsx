import * as React from "react"
import { motion, type HTMLMotionProps } from "motion/react"
import { type VariantProps } from "class-variance-authority"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Ripple = { id: number; x: number; y: number }

type RippleButtonProps = Omit<HTMLMotionProps<"button">, "ref"> &
  VariantProps<typeof buttonVariants> & {
    rippleColor?: string
    rippleScale?: number
    hoverScale?: number
    tapScale?: number
  }

export const RippleButton = React.forwardRef<
  HTMLButtonElement,
  RippleButtonProps
>(function RippleButton(
  {
    className,
    variant,
    size,
    onClick,
    rippleColor,
    rippleScale = 10,
    hoverScale = 1.03,
    tapScale = 0.97,
    style,
    disabled,
    children,
    ...props
  },
  ref
) {
  const [ripples, setRipples] = React.useState<Ripple[]>([])
  const localRef = React.useRef<HTMLButtonElement>(null)
  React.useImperativeHandle(ref, () => localRef.current as HTMLButtonElement)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = localRef.current
    if (button && !disabled) {
      const rect = button.getBoundingClientRect()
      const ripple: Ripple = {
        id: Date.now(),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      setRipples((prev) => [...prev, ripple])
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
      }, 600)
    }
    onClick?.(e)
  }

  const fillColor =
    rippleColor ??
    (variant === "outline" || variant === "ghost" || variant === "link"
      ? "var(--foreground)"
      : "var(--primary-foreground)")

  return (
    <motion.button
      ref={localRef}
      onClick={handleClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: hoverScale }}
      whileTap={disabled ? undefined : { scale: tapScale }}
      className={cn(
        buttonVariants({ variant, size, className }),
        "relative overflow-hidden"
      )}
      style={style}
      {...props}
    >
      {children as React.ReactNode}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          aria-hidden="true"
          initial={{ scale: 0, opacity: 0.4 }}
          animate={{ scale: rippleScale, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: r.y - 10,
            left: r.x - 10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: fillColor,
            pointerEvents: "none",
          }}
        />
      ))}
    </motion.button>
  )
})
