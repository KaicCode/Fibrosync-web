import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-12 w-full rounded-[1.1rem] border border-input bg-white/80 px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition-all placeholder:text-muted-foreground/70 focus:border-brand-300 focus:ring-4 focus:ring-brand-100/60',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
