import * as ProgressPrimitive from '@radix-ui/react-progress'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  ...props
}: ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-brand-100/80', className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-brand-gradient transition-all"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
