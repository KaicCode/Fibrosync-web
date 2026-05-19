import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-[120px] w-full rounded-[1.25rem] border border-input bg-white/80 px-4 py-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition-all placeholder:text-muted-foreground/70 focus:border-brand-300 focus:ring-4 focus:ring-brand-100/60',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
