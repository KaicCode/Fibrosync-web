import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-[1.5rem] border border-white/70 bg-white/68 px-5 py-4 backdrop-blur-xl md:flex-row md:items-end md:justify-between md:px-6 md:py-5',
        className,
      )}
    >
      <div className="max-w-xl space-y-2">
        {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
