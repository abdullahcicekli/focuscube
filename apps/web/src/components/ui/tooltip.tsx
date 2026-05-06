import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export const TooltipProvider = ({
  delayDuration = 200,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
)

export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

type TooltipContentProps = React.ComponentProps<
  typeof TooltipPrimitive.Content
> & {
  children: React.ReactNode
}

export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content asChild sideOffset={sideOffset} {...props}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className={cn(
            "z-50 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background shadow-md",
            className
          )}
        >
          {children}
        </motion.div>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}
