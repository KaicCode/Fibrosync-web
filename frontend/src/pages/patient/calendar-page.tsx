import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Droplets,
  HeartPulse,
  LoaderCircle,
  MoonStar,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { usePageTitle } from '@/hooks/use-page-title'
import { useDailyRecords } from '@/hooks/useDailyRecords'
import type { DailyRecord } from '@/services/daily-record.service'

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

type FrequencyItem = {
  label: string
  count: number
  percentage: number
}

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function isValidDateKey(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  return formatDateKey(parseDateKey(value)) === value
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function addMonths(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

function startOfCalendarGrid(date: Date): Date {
  const monthStart = startOfMonth(date)
  return new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    monthStart.getDate() - monthStart.getDay(),
  )
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatLongDate(dateKey: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parseDateKey(dateKey))
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
}

function buildFrequency(values: string[]): FrequencyItem[] {
  const counts = new Map<string, number>()

  values.forEach((value) => {
    const normalized = value.trim()

    if (!normalized) {
      return
    }

    counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
  })

  const highestCount = Math.max(...counts.values(), 1)

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / highestCount) * 100),
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 4)
}

function resolvePainVariant(
  painLevel: number,
): 'default' | 'success' | 'warning' | 'neutral' {
  if (painLevel >= 7) {
    return 'warning'
  }

  if (painLevel <= 2) {
    return 'success'
  }

  return 'default'
}

function resolveInitialDate(searchDate: string | null): string {
  return isValidDateKey(searchDate) ? searchDate : formatDateKey(new Date())
}

function buildCalendarCells(
  visibleMonth: Date,
  selectedDate: string,
  recordsByDate: Map<string, DailyRecord[]>,
) {
  const gridStart = startOfCalendarGrid(visibleMonth)
  const todayKey = formatDateKey(new Date())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    )
    const dateKey = formatDateKey(date)
    const dayRecords = recordsByDate.get(dateKey) ?? []
    const maxPain = dayRecords.reduce((highest, record) => Math.max(highest, record.painLevel), 0)

    return {
      date,
      dateKey,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
      isSelected: dateKey === selectedDate,
      isToday: dateKey === todayKey,
      recordCount: dayRecords.length,
      maxPain,
    }
  })
}

export function CalendarPage() {
  usePageTitle('Calendario')

  const [searchParams] = useSearchParams()
  const initialSelectedDate = resolveInitialDate(searchParams.get('date'))
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = parseDateKey(initialSelectedDate)
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })

  const monthStart = useMemo(() => formatDateKey(startOfMonth(visibleMonth)), [visibleMonth])
  const monthEnd = useMemo(() => formatDateKey(endOfMonth(visibleMonth)), [visibleMonth])
  const { records, isLoading } = useDailyRecords({
    dateFrom: monthStart,
    dateTo: monthEnd,
    limit: 100,
  })

  const recordsByDate = useMemo(() => {
    const grouped = new Map<string, DailyRecord[]>()

    records.forEach((record) => {
      const current = grouped.get(record.recordDate) ?? []
      current.push(record)
      grouped.set(record.recordDate, current)
    })

    grouped.forEach((dayRecords, dateKey) => {
      grouped.set(
        dateKey,
        dayRecords
          .slice()
          .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()),
      )
    })

    return grouped
  }, [records])

  const calendarCells = useMemo(
    () => buildCalendarCells(visibleMonth, selectedDate, recordsByDate),
    [recordsByDate, selectedDate, visibleMonth],
  )

  const selectedDayRecords = useMemo(
    () => recordsByDate.get(selectedDate) ?? [],
    [recordsByDate, selectedDate],
  )

  const selectedDayAreas = useMemo(
    () => [...new Set(selectedDayRecords.flatMap((record) => record.painAreas))],
    [selectedDayRecords],
  )

  const selectedDayTriggers = useMemo(
    () => [...new Set(selectedDayRecords.flatMap((record) => record.painTriggers))],
    [selectedDayRecords],
  )

  const dayMaxPain = useMemo(
    () => selectedDayRecords.reduce((highest, record) => Math.max(highest, record.painLevel), 0),
    [selectedDayRecords],
  )

  const dayAveragePain = useMemo(
    () => calculateAverage(selectedDayRecords.map((record) => record.painLevel)),
    [selectedDayRecords],
  )

  const monthlyCoverage = useMemo(() => {
    const totalDays = endOfMonth(visibleMonth).getDate()
    const capturedDays = recordsByDate.size

    return {
      capturedDays,
      totalDays,
      percentage: Math.round((capturedDays / Math.max(totalDays, 1)) * 100),
    }
  }, [recordsByDate, visibleMonth])

  const monthlyAveragePain = useMemo(
    () => calculateAverage(records.map((record) => record.painLevel)),
    [records],
  )

  const topAreas = useMemo(
    () => buildFrequency(records.flatMap((record) => record.painAreas)),
    [records],
  )

  const topTriggers = useMemo(
    () => buildFrequency(records.flatMap((record) => record.painTriggers)),
    [records],
  )

  const handleMonthChange = (offset: number) => {
    const nextMonth = addMonths(visibleMonth, offset)
    const currentSelectedDate = parseDateKey(selectedDate)
    const lastDayOfNextMonth = endOfMonth(nextMonth).getDate()
    const nextSelectedDate = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      Math.min(currentSelectedDate.getDate(), lastDayOfNextMonth),
    )

    setVisibleMonth(nextMonth)
    setSelectedDate(formatDateKey(nextSelectedDate))
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Planejamento do cuidado"
        title="Calendario clinico do seu historico"
        description="Visualize cada dor no dia certo, acompanhe a intensidade ao longo do mes e abra os detalhes salvos em cada registro."
        actions={
          <Button asChild>
            <Link to={`/app/pain-log?date=${selectedDate}`}>
              <Plus className="h-4 w-4" />
              Registrar neste dia
            </Link>
          </Button>
        }
      />

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
        <div className="card-surface p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Button variant="secondary" size="icon" onClick={() => handleMonthChange(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="section-label">{formatMonthLabel(visibleMonth)}</p>
              <h2 className="mt-1 text-xl font-semibold md:text-2xl">Calendario mensal</h2>
            </div>
            <Button variant="secondary" size="icon" onClick={() => handleMonthChange(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center md:gap-2">
            {weekDays.map((day, index) => (
              <div
                key={`${day}-${index}`}
                className="py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {calendarCells.map((day) => (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDate(day.dateKey)}
                className={`relative flex min-h-[5.35rem] flex-col items-start justify-between rounded-[1.1rem] border px-2.5 py-2 text-left transition ${
                  day.isSelected
                    ? 'border-transparent bg-brand-gradient text-white shadow-glow'
                    : day.isCurrentMonth
                      ? 'border-white/80 bg-white/75 text-foreground hover:bg-brand-50'
                      : 'border-white/50 bg-white/45 text-muted-foreground/45'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-semibold">{day.dayNumber}</span>
                  {day.recordCount > 0 ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        day.isSelected ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700'
                      }`}
                    >
                      {day.recordCount}
                    </span>
                  ) : null}
                </div>

                {day.recordCount > 0 ? (
                  <div className="w-full space-y-1">
                    <div className={`h-1.5 rounded-full ${day.isSelected ? 'bg-white/20' : 'bg-slate-100'}`}>
                      <div
                        className={`h-full rounded-full ${
                          day.isSelected ? 'bg-white' : day.maxPain >= 7 ? 'bg-amber-500' : 'bg-brand-500'
                        }`}
                        style={{ width: `${Math.max(day.maxPain, 1) * 10}%` }}
                      />
                    </div>
                    <p className={`text-[10px] ${day.isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                      Dor max {day.maxPain}/10
                    </p>
                  </div>
                ) : (
                  <span
                    className={`text-[10px] ${
                      day.isSelected ? 'text-white/70' : day.isToday ? 'text-brand-600' : 'text-transparent'
                    }`}
                  >
                    {day.isToday ? 'Hoje' : 'sem registros'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label">{formatLongDate(selectedDate)}</p>
                <h2 className="mt-2 text-xl font-semibold md:text-2xl">Registros do dia</h2>
              </div>
              <Badge variant={selectedDayRecords.length > 0 ? 'default' : 'neutral'}>
                {selectedDayRecords.length} registro{selectedDayRecords.length === 1 ? '' : 's'}
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <LoaderCircle className="h-7 w-7 animate-spin text-brand-500" />
              </div>
            ) : selectedDayRecords.length > 0 ? (
              <>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <StatCard
                    label="Dor maxima"
                    value={`${dayMaxPain}/10`}
                    hint="Maior intensidade salva"
                    icon={HeartPulse}
                  />
                  <StatCard
                    label="Dor media"
                    value={`${dayAveragePain.toFixed(1)}/10`}
                    hint="Media dos registros"
                    icon={Sparkles}
                  />
                  <StatCard
                    label="Gatilhos"
                    value={selectedDayTriggers.length.toString()}
                    hint="Fatores diferentes no dia"
                    icon={Droplets}
                  />
                </div>

                {selectedDayAreas.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedDayAreas.map((area) => (
                      <Badge key={area}>{area}</Badge>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 space-y-3">
                  {selectedDayRecords.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-[1.2rem] border border-white/80 bg-white/84 px-4 py-4 shadow-soft"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {record.painType || 'Registro de dor'}
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatTime(record.createdAt)}
                          </p>
                        </div>
                        <Badge variant={resolvePainVariant(record.painLevel)}>{record.painLevel}/10</Badge>
                      </div>

                      {record.painAreas.length > 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">Areas:</span> {record.painAreas.join(', ')}
                        </p>
                      ) : null}

                      {record.painTriggers.length > 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">Gatilhos:</span>{' '}
                          {record.painTriggers.join(', ')}
                        </p>
                      ) : null}

                      {record.notes ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">Observacao:</span> {record.notes}
                        </p>
                      ) : null}

                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-[1rem] bg-brand-50/55 p-3 text-xs text-muted-foreground">
                        <div>
                          Fadiga <span className="font-semibold text-foreground">{record.fatigueLevel}/10</span>
                        </div>
                        <div>
                          Estresse <span className="font-semibold text-foreground">{record.stressLevel}/10</span>
                        </div>
                        <div>
                          Humor <span className="font-semibold text-foreground">{record.mood}/10</span>
                        </div>
                        <div>
                          Sono{' '}
                          <span className="font-semibold text-foreground">
                            {record.sleepHours !== null ? `${record.sleepHours}h` : 'nao informado'}
                          </span>
                        </div>
                        <div>
                          Qualidade{' '}
                          <span className="font-semibold text-foreground">
                            {record.sleepQuality !== null ? `${record.sleepQuality}/10` : 'nao informada'}
                          </span>
                        </div>
                        <div>
                          Hidratacao{' '}
                          <span className="font-semibold text-foreground">
                            {record.hydration !== null ? `${record.hydration}L` : 'nao informada'}
                          </span>
                        </div>
                        <div>
                          Atividade{' '}
                          <span className="font-semibold text-foreground">
                            {record.physicalActivity !== null ? `${record.physicalActivity} min` : 'nao informada'}
                          </span>
                        </div>
                        <div>
                          Medicacao{' '}
                          <span className="font-semibold text-foreground">
                            {record.medicationTaken === null
                              ? 'nao informada'
                              : record.medicationTaken
                                ? 'tomada'
                                : 'nao tomada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-[1.2rem] border border-dashed border-slate-200 bg-slate-50/70 p-5">
                <p className="text-sm text-muted-foreground">
                  Ainda nao ha registros salvos neste dia. Clique abaixo para registrar a dor nessa data.
                </p>
                <Button asChild className="mt-4">
                  <Link to={`/app/pain-log?date=${selectedDate}`}>Registrar dor neste dia</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="card-surface p-5">
            <p className="section-label">Panorama do mes</p>
            <h2 className="mt-2 text-xl font-semibold md:text-2xl">Resumo clinico do periodo</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard
                label="Registros"
                value={records.length.toString()}
                hint="Total salvo no mes"
                icon={HeartPulse}
              />
              <StatCard
                label="Dias com dados"
                value={monthlyCoverage.capturedDays.toString()}
                hint={`${monthlyCoverage.totalDays} dias na janela`}
                icon={MoonStar}
              />
              <StatCard
                label="Dor media"
                value={`${monthlyAveragePain.toFixed(1)}/10`}
                hint="Media de intensidade"
                icon={Sparkles}
              />
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Cobertura do calendario</span>
                <span className="text-muted-foreground">{monthlyCoverage.percentage}%</span>
              </div>
              <Progress value={monthlyCoverage.percentage} />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Areas mais recorrentes</p>
                {topAreas.length > 0 ? (
                  topAreas.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.label}</span>
                        <span className="text-muted-foreground">{item.count} registros</span>
                      </div>
                      <Progress value={item.percentage} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sem areas registradas neste mes.</p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Gatilhos mais frequentes</p>
                {topTriggers.length > 0 ? (
                  topTriggers.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.label}</span>
                        <span className="text-muted-foreground">{item.count} registros</span>
                      </div>
                      <Progress value={item.percentage} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sem gatilhos registrados neste mes.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
