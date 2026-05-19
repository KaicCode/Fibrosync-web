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
        'flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/68 px-6 py-5 backdrop-blur-xl md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="max-w-2xl space-y-2">
        {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold md:text-[2.35rem]">{title}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  )
}
