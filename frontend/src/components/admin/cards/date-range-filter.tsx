import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DateRangePreset = {
  label: string
  active?: boolean
  onSelect: () => void
}

type DateRangeFilterProps = {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onApply?: () => void
  presets?: DateRangePreset[]
  helperText?: string
  errorMessage?: string
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  presets,
  helperText,
  errorMessage,
}: DateRangeFilterProps) {
  return (
    <div className="card-surface space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[14rem] flex-1 items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-medium text-foreground">Data inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={cn(
              'min-w-0 flex-1 rounded-xl border bg-background px-3 py-2 text-sm text-foreground',
              errorMessage ? 'border-rose-300 focus-visible:outline-rose-500' : 'border-input',
            )}
          />
        </div>

        <div className="flex min-w-[14rem] flex-1 items-center gap-2">
          <label className="text-sm font-medium text-foreground">Data final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className={cn(
              'min-w-0 flex-1 rounded-xl border bg-background px-3 py-2 text-sm text-foreground',
              errorMessage ? 'border-rose-300 focus-visible:outline-rose-500' : 'border-input',
            )}
          />
        </div>

        {onApply && (
          <Button
            onClick={onApply}
            type="button"
          >
            Aplicar
          </Button>
        )}
      </div>

      {presets?.length ? (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              size="sm"
              variant={preset.active ? 'default' : 'secondary'}
              onClick={preset.onSelect}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      ) : null}

      {errorMessage ? (
        <p className="text-sm text-rose-700">{errorMessage}</p>
      ) : helperText ? (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  )
}
