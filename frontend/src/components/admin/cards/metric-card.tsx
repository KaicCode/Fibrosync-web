import { Loader, TrendingDown, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type MetricCardProps = {
  label: string
  value?: string | number
  icon: LucideIcon
  trend?: number | null
  trendLabel?: string
  description?: string
  meta?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  isLoading?: boolean
}

const variantStyles = {
  default: 'bg-blue-50 text-blue-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  danger: 'bg-red-50 text-red-700',
}

export function AdminMetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  description,
  meta,
  variant = 'default',
  isLoading = false,
}: MetricCardProps) {
  const isTrendingUp = trend !== null && trend !== undefined && trend > 0

  return (
    <div className="card-surface p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          {isLoading ? (
            <div className="mb-2 flex h-[2.35rem] items-center">
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <h3 className="text-3xl font-bold text-foreground mb-2">{value}</h3>
          )}
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className={`p-3 rounded-lg ${variantStyles[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend !== null && trend !== undefined && !isLoading ? (
        <div className="flex items-center gap-1 mt-4 text-sm">
          {isTrendingUp ? (
            <>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-semibold">+{trend}%</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-red-600 font-semibold">{trend}%</span>
            </>
          )}
          <span className="text-muted-foreground">
            {trendLabel ?? 'vs periodo anterior'}
          </span>
        </div>
      ) : meta ? (
        <p className="mt-4 text-sm text-muted-foreground">{meta}</p>
      ) : isLoading ? (
        <div className="mt-4 h-5 w-40 animate-pulse rounded-full bg-muted" />
      ) : null}
    </div>
  )
}
