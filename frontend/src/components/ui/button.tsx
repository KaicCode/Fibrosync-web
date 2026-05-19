import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[1.1rem] text-sm font-semibold tracking-[-0.02em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-brand-gradient text-primary-foreground shadow-glow hover:scale-[1.01] hover:shadow-[0_22px_48px_rgba(123,77,255,0.24)]',
        secondary:
          'border border-white/80 bg-white/90 text-foreground shadow-soft hover:bg-white',
        ghost: 'text-muted-foreground hover:bg-brand-50 hover:text-brand-700',
        outline:
          'border border-brand-200/70 bg-white/70 text-brand-700 shadow-soft hover:bg-brand-50/90',
        soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
      },
      size: {
        default: 'h-12 px-5 py-3',
        sm: 'h-10 rounded-xl px-4 text-xs',
        lg: 'h-14 rounded-[1.25rem] px-6 text-base',
        icon: 'h-11 w-11 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp className={cn(buttonVariants({ className, variant, size }))} {...props} />
  )
}

export { Button }
