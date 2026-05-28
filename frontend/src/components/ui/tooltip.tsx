import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TooltipProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={120}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 10,
  ...props
}: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-xs rounded-2xl border border-white/80 bg-slate-950/92 px-3 py-2 text-xs leading-5 text-white shadow-[0_18px_46px_rgba(15,23,42,0.28)] backdrop-blur",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
