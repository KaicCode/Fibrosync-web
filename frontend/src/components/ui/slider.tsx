import * as SliderPrimitive from '@radix-ui/react-slider'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

function Slider({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-brand-100/90">
        <SliderPrimitive.Range className="absolute h-full bg-brand-gradient" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-4 border-white bg-brand-500 shadow-[0_10px_22px_rgba(123,77,255,0.32)] ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
    </SliderPrimitive.Root>
  )
}

export { Slider }
