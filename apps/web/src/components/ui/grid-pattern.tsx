import { useId, type SVGProps } from "react"

import { cn } from "@/lib/utils"

type Variant = "default" | "small" | "large"

type GridPatternProps = SVGProps<SVGSVGElement> & {
  width?: number
  height?: number
  x?: number
  y?: number
  squares?: Array<[x: number, y: number]>
  strokeDasharray?: string
  variant?: Variant
}

const variantStyles: Record<Variant, { width: number; height: number; className: string }> = {
  default: {
    width: 30,
    height: 30,
    className: "stroke-foreground/10",
  },
  small: {
    width: 12,
    height: 12,
    className: "stroke-foreground/10",
  },
  large: {
    width: 60,
    height: 60,
    className: "stroke-foreground/15",
  },
}

export function GridPattern({
  width,
  height,
  x = -1,
  y = -1,
  strokeDasharray = "0",
  squares,
  className,
  variant = "default",
  ...props
}: GridPatternProps) {
  const id = useId()
  const cfg = variantStyles[variant]
  const w = width ?? cfg.width
  const h = height ?? cfg.height

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        cfg.className,
        className
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={w}
          height={h}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${h}V.5H${w}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([sx, sy]) => (
            <rect
              key={`${sx}-${sy}`}
              className="fill-foreground/[0.04]"
              strokeWidth="0"
              width={w - 1}
              height={h - 1}
              x={sx * w + 1}
              y={sy * h + 1}
            />
          ))}
        </svg>
      )}
    </svg>
  )
}
