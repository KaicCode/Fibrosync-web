import { motion, type HTMLMotionProps, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

type LandingRevealProps = HTMLMotionProps<'div'> & {
  delay?: number
  y?: number
}

export function LandingReveal({
  children,
  className,
  delay = 0,
  y = 24,
  ...props
}: LandingRevealProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
