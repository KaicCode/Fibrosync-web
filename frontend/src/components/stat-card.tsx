import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string
  hint?: string
  trend?: string
  icon?: LucideIcon
  tone?: 'default' | 'success' | 'warning'
  footer?: ReactNode
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  tone = 'default',
  footer,
  className,
}: StatCardProps) {
  return (
    <div className={cn('card-surface p-4 md:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="space-y-1">
            <p className="text-2xl font-semibold tracking-[-0.06em] text-foreground md:text-[1.75rem]">{value}</p>
            {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
          </div>
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {trend ? (
        <div className="mt-4 flex items-center justify-between gap-2">
          <Badge variant={tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'default'}>
            <ArrowUpRight className="h-3.5 w-3.5" />
            {trend}
          </Badge>
          {footer}
        </div>
      ) : footer ? (
        <div className="mt-4">{footer}</div>
      ) : null}
    </div>
  )
}
