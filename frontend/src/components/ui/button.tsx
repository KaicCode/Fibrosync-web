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
          'bg-brand-gradient text-primary-foreground shadow-glow hover:scale-[1.005] hover:shadow-[0_18px_40px_rgba(123,77,255,0.22)]',
        secondary:
          'border border-white/80 bg-white/90 text-foreground shadow-soft hover:bg-white',
        ghost: 'text-muted-foreground hover:bg-brand-50 hover:text-brand-700',
        outline:
          'border border-brand-200/70 bg-white/70 text-brand-700 shadow-soft hover:bg-brand-50/90',
        soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
      },
      size: {
        default: 'h-11 px-4 py-2.5',
        sm: 'h-9 rounded-xl px-3.5 text-xs',
        lg: 'h-12 rounded-[1.2rem] px-5 text-sm md:text-base',
        icon: 'h-10 w-10 rounded-xl',
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
