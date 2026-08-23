import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  Brain,
  Database,
  type LucideIcon,
  RefreshCw,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { DateRangeFilter } from '@/components/admin/cards/date-range-filter'
import { AdminContentSection } from '@/components/admin/cards/content-section'
import { TrendLineChart } from '@/components/charts/trend-line-chart'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePageTitle } from '@/hooks/use-page-title'
import { adminService } from '@/services/admin.service'
import type {
  AdminAnalyticsCooccurrenceItem,
  AdminAnalyticsSymptomItem,
  AdminAnalyticsTriggerItem,
} from '@/types/admin'

const PRESET_OPTIONS = [7, 30, 90] as const
const MAX_LIST_ITEMS = 10

type PresetDays = (typeof PRESET_OPTIONS)[number]

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function resolvePresetRange(days: PresetDays): {
  startDate: string
  endDate: string
} {
  const today = new Date()
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - (days - 1))

  return {
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(endDate),
  }
}

function formatCompactNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

function formatPercent(value: number | null): string {
  if (typeof value !== 'number') {
    return 'Sem base suficiente'
  }

  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })}%`
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, 12))
}

function formatShortDate(value: string, periodDays: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: periodDays > 31 ? '2-digit' : undefined,
  }).format(parseDateKey(value))
}

function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parseDateKey(value))
}

function isPresetActive(
  startDate: string,
  endDate: string,
  days: PresetDays,
): boolean {
  const preset = resolvePresetRange(days)
  return preset.startDate === startDate && preset.endDate === endDate
}

function PageErrorState({
  onRetry,
}: {
  onRetry: () => void
}) {
  return (
    <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/90 px-5 py-5">
      <p className="text-sm font-semibold text-rose-800">
        Não foi possível carregar os analíticos administrativos.
      </p>
      <p className="mt-2 text-sm leading-6 text-rose-700">
        Tente novamente em alguns instantes para buscar os dados agregados do período.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-4"
        onClick={onRetry}
      >
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function SummarySkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="rounded-[1.35rem] border border-white/80 bg-white/85 p-5 shadow-soft"
        >
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-4 h-9 w-24" />
          <Skeleton className="mt-4 h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: LucideIcon
  label: string
  value: string
  helper: string
}) {
  return (
    <article className="rounded-[1.35rem] border border-white/80 bg-white/85 p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{helper}</p>
    </article>
  )
}

function TriggerList({
  items,
}: {
  items: AdminAnalyticsTriggerItem[]
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum gatilho registrado neste período."
        description="Os dados aparecerão aqui conforme os pacientes registrarem seus acompanhamentos."
      />
    )
  }

  const visibleItems = items.slice(0, MAX_LIST_ITEMS)
  const maxCount = Math.max(...visibleItems.map((item) => item.count), 1)

  return (
    <div className="space-y-4">
      {items.length > MAX_LIST_ITEMS ? (
        <Badge variant="neutral">Mostrando os {MAX_LIST_ITEMS} maiores volumes do período.</Badge>
      ) : null}

      <div className="space-y-4">
        {visibleItems.map((item) => {
          const width = Math.max((item.count / maxCount) * 100, item.count > 0 ? 8 : 0)

          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(item.percentageOfRecords)} dos registros do período
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatCompactNumber(item.count)} registros
                </p>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-gradient transition-[width]"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SymptomFrequencyList({
  items,
}: {
  items: AdminAnalyticsSymptomItem[]
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Ainda não há registros suficientes para esta análise."
        description="A frequência dos sintomas aparecerá aqui conforme novos registros forem sendo feitos."
      />
    )
  }

  const visibleItems = items.slice(0, MAX_LIST_ITEMS)
  const maxFrequency = Math.max(...visibleItems.map((item) => item.frequency), 1)

  return (
    <div className="space-y-4">
      {items.length > MAX_LIST_ITEMS ? (
        <Badge variant="neutral">Mostrando os {MAX_LIST_ITEMS} sintomas mais frequentes.</Badge>
      ) : null}

      <div className="space-y-4">
        {visibleItems.map((item) => {
          const width = Math.max((item.frequency / maxFrequency) * 100, item.frequency > 0 ? 8 : 0)

          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(item.percentageOfRecords)} dos registros do período
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCompactNumber(item.frequency)} registros
                  </p>
                  {typeof item.averageIntensity === 'number' ? (
                    <p className="text-xs text-muted-foreground">
                      Intensidade média: {item.averageIntensity.toLocaleString('pt-BR', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                      /10
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#38bdf8)] transition-[width]"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SymptomIntensityList({
  items,
}: {
  items: AdminAnalyticsSymptomItem[]
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Ainda não há intensidade suficiente para esta leitura."
        description="A intensidade média só aparece quando o sintoma possui valor numérico real nos registros."
      />
    )
  }

  return (
    <div className="space-y-4">
      <Badge variant="neutral">Somente sintomas com intensidade numérica entram neste cálculo.</Badge>

      <div className="grid gap-3 md:grid-cols-2">
        {items.slice(0, MAX_LIST_ITEMS).map((item) => (
          <div
            key={item.label}
            className="rounded-[1.25rem] border border-white/80 bg-white/82 px-4 py-4 shadow-soft"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Base em {formatCompactNumber(item.intensitySampleSize)} registros com intensidade.
                </p>
              </div>
              <Badge variant="warning">
                {(item.averageIntensity ?? 0).toLocaleString('pt-BR', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                /10
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CooccurrenceList({
  items,
  minimumRecords,
}: {
  items: AdminAnalyticsCooccurrenceItem[]
  minimumRecords: number
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Precisamos de mais registros para identificar combinações recorrentes."
        description={`As combinações só aparecem quando o mesmo par surge em pelo menos ${minimumRecords} registros do período.`}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Badge variant="neutral">
        Pares exibidos a partir de {minimumRecords} registros em comum no período.
      </Badge>

      <div className="grid gap-3 md:grid-cols-2">
        {items.slice(0, MAX_LIST_ITEMS).map((item) => (
          <div
            key={item.label}
            className="rounded-[1.25rem] border border-white/80 bg-white/82 px-4 py-4 shadow-soft"
          >
            <p className="text-sm font-semibold text-foreground">{item.label}</p>
            <div className="mt-3 flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                {formatPercent(item.percentageOfRecords)} dos registros
              </span>
              <span className="font-semibold text-foreground">
                {formatCompactNumber(item.count)} ocorrências
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminAnalyticsPage() {
  usePageTitle('Analíticos avançados')

  const defaultRange = resolvePresetRange(30)
  const [startDate, setStartDate] = useState(defaultRange.startDate)
  const [endDate, setEndDate] = useState(defaultRange.endDate)

  const hasIncompleteRange = !startDate || !endDate
  const hasInvalidRange =
    !hasIncompleteRange && new Date(startDate).getTime() > new Date(endDate).getTime()
  const rangeError = hasInvalidRange
    ? 'A data inicial deve ser anterior à data final.'
    : undefined

  const analyticsQuery = useQuery({
    queryKey: ['admin-analytics', startDate, endDate],
    queryFn: () => adminService.getAnalytics({ startDate, endDate }),
    enabled: !hasIncompleteRange && !hasInvalidRange,
    placeholderData: keepPreviousData,
  })

  const analytics = analyticsQuery.data
  const isInitialLoading = analyticsQuery.isLoading && !analytics
  const isRefreshing = analyticsQuery.isFetching && Boolean(analytics)

  const intensityItems = [...(analytics?.symptoms ?? [])]
    .filter((item) => typeof item.averageIntensity === 'number')
    .sort(
      (left, right) =>
        (right.averageIntensity ?? 0) - (left.averageIntensity ?? 0) ||
        right.frequency - left.frequency ||
        left.label.localeCompare(right.label, 'pt-BR'),
  )

  const analysisHistorySeries = (analytics?.analysisHistory ?? []).map((point) => ({
    label: formatShortDate(point.date, analytics?.period.days ?? 30),
    tooltipLabel: formatLongDate(point.date),
    value: point.ruleEngineCount,
    comparison: point.aiCount,
  }))

  const helperText = hasIncompleteRange
    ? 'Selecione as duas datas para carregar os dados do período.'
    : 'Os dados abaixo são recalculados automaticamente sempre que o período muda.'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrador"
        title="Analíticos avançados"
        description="Acompanhe padrões, tendências e indicadores agregados da plataforma."
        actions={
          <Badge variant={isRefreshing ? 'warning' : 'neutral'}>
            {isRefreshing
              ? 'Atualizando dados...'
              : analytics?.generatedAt
                ? `Atualizado em ${new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(analytics.generatedAt))}`
                : 'Sem atualização recente'}
          </Badge>
        }
      />

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        helperText={helperText}
        errorMessage={rangeError}
        presets={PRESET_OPTIONS.map((days) => ({
          label: `Últimos ${days} dias`,
          active: isPresetActive(startDate, endDate, days),
          onSelect: () => {
            const preset = resolvePresetRange(days)
            setStartDate(preset.startDate)
            setEndDate(preset.endDate)
          },
        }))}
      />

      {analyticsQuery.isError && !analytics ? (
        <PageErrorState onRetry={() => void analyticsQuery.refetch()} />
      ) : null}

      {isInitialLoading ? (
        <SummarySkeletonGrid />
      ) : analytics ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={Database}
            label="Total de registros"
            value={formatCompactNumber(analytics.summary.totalRecords)}
            helper="Quantidade real de registros do período selecionado."
          />
          <SummaryCard
            icon={Users}
            label="Pacientes com registros"
            value={formatCompactNumber(analytics.summary.patientsWithRecords)}
            helper="Pacientes distintos que registraram acompanhamentos no período."
          />
          <SummaryCard
            icon={Activity}
            label="Gatilhos identificados"
            value={formatCompactNumber(analytics.summary.triggerTypes)}
            helper="Tipos distintos de gatilho que realmente apareceram nos registros."
          />
          <SummaryCard
            icon={Brain}
            label="Análises geradas"
            value={formatCompactNumber(analytics.summary.analysesGenerated)}
            helper={`${formatCompactNumber(analytics.summary.ruleEngineAnalyses)} por regras e ${formatCompactNumber(analytics.summary.aiAnalyses)} com IA.`}
          />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminContentSection
          title="Gatilhos mais registrados"
          description="Fatores que apareceram com maior frequência nos registros do período."
          isLoading={isInitialLoading}
        >
          <TriggerList items={analytics?.triggers ?? []} />
        </AdminContentSection>

        <AdminContentSection
          title="Frequência dos sintomas"
          description="Sintomas mais presentes nos registros do período."
          isLoading={isInitialLoading}
        >
          <SymptomFrequencyList items={analytics?.symptoms ?? []} />
        </AdminContentSection>
      </div>

      <AdminContentSection
        title="Histórico de análises"
        description="Volume diário de análises geradas por regras e por inteligência artificial."
        isLoading={isInitialLoading}
      >
        {analytics && analytics.analysisHistory.length > 0 ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">
                {formatCompactNumber(analytics.summary.ruleEngineAnalyses)} análises por regras
              </Badge>
              <Badge variant="neutral">
                {formatCompactNumber(analytics.summary.aiAnalyses)} análises com IA
              </Badge>
              <Badge variant="neutral">Baseado na data de geração das análises.</Badge>
            </div>

            <TrendLineChart
              data={analysisHistorySeries}
              dataKey="value"
              secondaryKey="comparison"
              color="#0f766e"
              primaryLabel="Análises por regras"
              secondaryLabel="Análises com IA"
              showLegend
              valueFormatter={(value) => `${formatCompactNumber(value)} análises`}
              tooltipValueFormatter={(value) => `${formatCompactNumber(value)} análises`}
              emptyState={{
                title: 'Nenhuma análise foi gerada neste período.',
                description: 'Quando houver novas análises, o histórico aparecerá aqui.',
              }}
              singleRecordState={{
                title: 'Ainda há poucos pontos para uma curva temporal.',
                description: 'Mais dias com análises vão completar a evolução do período.',
              }}
            />
          </div>
        ) : (
          <EmptyState
            title="Nenhuma análise foi gerada neste período."
            description="Quando houver novas análises por regras ou por IA, o histórico aparecerá aqui."
          />
        )}
      </AdminContentSection>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminContentSection
          title="Intensidade média"
          description="Leitura calculada apenas com sintomas que possuem intensidade numérica real."
          isLoading={isInitialLoading}
        >
          <SymptomIntensityList items={intensityItems} />
        </AdminContentSection>

        <AdminContentSection
          title="Sintomas que aparecem juntos"
          description="Combinações observadas com maior frequência nos registros."
          isLoading={isInitialLoading}
        >
          <CooccurrenceList
            items={analytics?.cooccurrences ?? []}
            minimumRecords={analytics?.methodology.cooccurrenceMinimumRecords ?? 5}
          />
        </AdminContentSection>
      </div>

      {analytics ? (
        <div className="rounded-[1.4rem] border border-white/80 bg-white/80 px-5 py-4 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Notas metodológicas</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Esta tela mostra apenas dados agregados do período entre{' '}
                <span className="font-medium text-foreground">
                  {formatLongDate(analytics.period.startDate)}
                </span>{' '}
                e{' '}
                <span className="font-medium text-foreground">
                  {formatLongDate(analytics.period.endDate)}
                </span>
                . Não exibimos acurácia porque não existe ground truth persistido para validar
                previsões futuras neste painel.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-semibold">
                Coocorrências exigem pelo menos{' '}
                {analytics.methodology.cooccurrenceMinimumRecords} registros.
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
