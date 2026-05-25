import { Calendar } from 'lucide-react'

type DateRangeFilterProps = {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onApply?: () => void
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
}: DateRangeFilterProps) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <label className="text-sm font-medium text-foreground">Data Inicial:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Data Final:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
          />
        </div>

        {onApply && (
          <button
            onClick={onApply}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Aplicar
          </button>
        )}
      </div>
    </div>
  )
}
