import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import {
  tooltipContentClassName,
  tooltipProviderDelayDuration,
} from "./tooltip.constants";

export function TooltipProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={tooltipProviderDelayDuration}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export function Tooltip({
  children,
  ...props
}: ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>;
}

export const TooltipTrigger = forwardRef<
  ElementRef<typeof TooltipPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(function TooltipTrigger(props, ref) {
  return <TooltipPrimitive.Trigger ref={ref} {...props} />;
});

TooltipTrigger.displayName =
  TooltipPrimitive.Trigger.displayName ?? "TooltipTrigger";

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(function TooltipContent(
  { className, sideOffset = 10, ...props },
  ref,
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(tooltipContentClassName, className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});

TooltipContent.displayName =
  TooltipPrimitive.Content.displayName ?? "TooltipContent";
