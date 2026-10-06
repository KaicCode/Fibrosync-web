import { cn } from '@/lib/utils'

type LandingSectionHeadingProps = {
  eyebrow?: string
  title: string
  description: string
  align?: 'left' | 'center'
  className?: string
}

export function LandingSectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: LandingSectionHeadingProps) {
  return (
    <div className={cn(align === 'left' ? 'max-w-2xl text-left' : 'mx-auto max-w-3xl text-center', className)}>
      {eyebrow ? <p className="section-label text-brand-700/90">{eyebrow}</p> : null}
      <h2
        className={cn(
          eyebrow && 'mt-4',
          'text-3xl font-semibold leading-tight text-balance text-slate-950 sm:text-4xl lg:text-[3rem]',
        )}
      >
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base lg:text-lg">
        {description}
      </p>
    </div>
  )
}
