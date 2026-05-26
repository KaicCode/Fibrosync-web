import {
  Activity,
  Brain,
  Download,
  HeartPulse,
  LoaderCircle,
  MoonStar,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { RingChart } from '@/components/charts/ring-chart'
import { TrendLineChart } from '@/components/charts/trend-line-chart'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePageTitle } from '@/hooks/use-page-title'
import { useReports } from '@/hooks/useReports'
import type {
  ReportPatternItem,
  ReportPeriod,
  ReportResponse,
  ReportStructuredData,
  ReportTrend,
} from '@/services/report.service'
import { useState } from 'react'

const chartColors = ['#7B4DFF', '#FF9A4D', '#53A2FF', '#7ED7B1', '#F46EA3', '#FFC857']

function formatDecimal(value: number, digits = 1): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

function formatChartLabel(value: string): string {
  const date = new Date(value)
  const hasTime = value.includes('T')

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    ...(hasTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  }).format(date)
}

function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'Ainda nao gerado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function resolveTrendLabel(trend: ReportTrend): string {
  if (trend === 'improving') {
    return 'Em melhora'
  }

  if (trend === 'worsening') {
    return 'Em piora'
  }

  return 'Estavel'
}

function resolveTrendVariant(trend: ReportTrend): 'default' | 'success' | 'warning' {
  if (trend === 'improving') {
    return 'success'
  }

  if (trend === 'worsening') {
    return 'warning'
  }

  return 'default'
}

function resolvePeriodLabel(period: ReportPeriod): string {
  if (period === 'weekly') {
    return 'Semana'
  }

  if (period === 'quarterly') {
    return '90 dias'
  }

  return 'Mes'
}

function resolveSourceLabel(source: string | null): string {
  if (source === 'ai_prediction') {
    return 'IA'
  }

  if (source === 'rule_engine') {
    return 'Motor clinico'
  }

  return 'Sem fonte dominante'
}

function resolveMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    painLevel: 'Dor',
    sleepHours: 'Sono',
    fatigueLevel: 'Fadiga',
    stressLevel: 'Estresse',
    moodLevel: 'Humor',
    hydration: 'Hidratacao',
    physicalActivity: 'Atividade',
    crisisProbability: 'Risco de crise',
  }

  return labels[metric] ?? metric
}

function buildTrendSeries(
  series: Array<{ date: string; value: number }>,
  comparison?: number,
) {
  return series.map((point) => ({
    label: formatChartLabel(point.date),
    value: point.value,
    comparison,
  }))
}

function buildProbabilitySeries(
  reportData: ReportStructuredData,
) {
  return reportData.crisisProbability.dailySeries
    .filter((point) => point.combinedProbabilityScore !== null)
    .map((point) => ({
      label: formatChartLabel(point.date),
      value: point.combinedProbabilityScore ?? 0,
      comparison: reportData.crisisProbability.averageProbabilityScore,
    }))
}

function buildRingData(items: ReportPatternItem[]) {
  return items.map((item, index) => ({
    label: item.label,
    value: Number(item.percentage.toFixed(1)),
    color: chartColors[index % chartColors.length],
    fill: chartColors[index % chartColors.length],
  }))
}

function resolveDistribution(data: ReportStructuredData) {
  if (data.painPatterns.areas.length > 0) {
    return {
      title: 'Areas com mais recorrencia',
      description: 'Percentual de registros em que cada area apareceu.',
      items: data.painPatterns.areas,
    }
  }

  if (data.painPatterns.triggers.length > 0) {
    return {
      title: 'Gatilhos mais citados',
      description: 'Percentual de registros em que cada gatilho apareceu.',
      items: data.painPatterns.triggers,
    }
  }

  return {
    title: 'Tipos de dor mais frequentes',
    description: 'Percentual de registros em que cada tipo de dor apareceu.',
    items: data.painPatterns.types,
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function openPrintableReport(report: ReportResponse) {
  if (typeof window === 'undefined' || !report.data) {
    return
  }

  const reportData = report.data
  const distribution = resolveDistribution(reportData)
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')

  if (!printWindow) {
    return
  }

  const metrics = [
    ['Dor media', `${formatDecimal(reportData.overview.averagePainLevel)}/10`],
    ['Registros', `${reportData.overview.recordedEntries}`],
    ['Cobertura', formatPercentage(reportData.overview.dataCoverageRate)],
    ['Risco medio', formatPercentage(reportData.overview.averageProbabilityScore)],
  ]

  const listToHtml = (items: string[]) =>
    items.length > 0
      ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : '<p>Sem dados suficientes neste periodo.</p>'

  const html = `<!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatorio clinico - FibroSync</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 32px;
            color: #201733;
            line-height: 1.5;
          }
          h1, h2 {
            margin-bottom: 8px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin: 24px 0;
          }
          .card {
            border: 1px solid #eadffd;
            border-radius: 16px;
            padding: 16px;
            background: #faf7ff;
          }
          ul {
            padding-left: 18px;
          }
          li {
            margin-bottom: 6px;
          }
          .muted {
            color: #665d78;
          }
        </style>
      </head>
      <body>
        <h1>Relatorio visual com clareza clinica</h1>
        <p class="muted">
          Janela ${escapeHtml(resolvePeriodLabel(report.period))} | ${escapeHtml(formatLongDate(report.periodStart))} ate ${escapeHtml(formatLongDate(report.periodEnd))}
        </p>
        <p class="muted">Gerado em ${escapeHtml(formatDateTime(report.generatedAt))}</p>

        <div class="grid">
          ${metrics
            .map(
              ([label, value]) =>
                `<div class="card"><strong>${escapeHtml(label)}</strong><div>${escapeHtml(value)}</div></div>`,
            )
            .join('')}
        </div>

        <h2>Padroes de dor</h2>
        ${listToHtml(
          distribution.items.map(
            (item) => `${item.label}: ${formatPercentage(item.percentage)} dos registros (${item.occurrences} ocorrencias)`,
          ),
        )}

        <h2>Gatilhos recorrentes</h2>
        ${listToHtml(
          reportData.recurringTriggers.map(
            (item) => `${item.label}: ${formatPercentage(item.highRiskRate)} dos dias de alto risco`,
          ),
        )}

        <h2>Correlacoes clinicas</h2>
        ${listToHtml(
          reportData.correlations.map(
            (item) =>
              `${resolveMetricLabel(item.leftMetric)} x ${resolveMetricLabel(item.rightMetric)}: coeficiente ${formatDecimal(item.coefficient, 2)} (${item.direction})`,
          ),
        )}
      </body>
    </html>`

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

export function ReportsPage() {
  usePageTitle('Relatorios')
  const [period, setPeriod] = useState<ReportPeriod>('weekly')
  const { report, error, isLoading, isFetching, refetch } = useReports(period)

  const reportData = report?.data ?? null
  const hasEntries = (reportData?.overview.recordedEntries ?? 0) > 0
  const distribution = reportData ? resolveDistribution(reportData) : null
  const distributionData = distribution ? buildRingData(distribution.items) : []
  const painTrendData = reportData
    ? buildTrendSeries(reportData.painEvolution.series, reportData.painEvolution.average)
    : []
  const sleepTrendData = reportData
    ? buildTrendSeries(reportData.sleepEvolution.hours.series, reportData.sleepEvolution.hours.average)
    : []
  const probabilityTrendData = reportData ? buildProbabilitySeries(reportData) : []

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analytics premium"
        title="Relatorios visuais com clareza clinica"
        description="Acompanhe intensidade, risco, padrões e correlacoes para conversar com mais precisao sobre a sua dor."
        actions={
          <Button
            variant="secondary"
            disabled={!reportData || !hasEntries}
            onClick={() => {
              if (report) {
                openPrintableReport(report)
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        }
      />

      <Tabs value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="weekly">Semana</TabsTrigger>
            <TabsTrigger value="monthly">Mes</TabsTrigger>
            <TabsTrigger value="quarterly">90 dias</TabsTrigger>
          </TabsList>

          {isFetching && !isLoading ? <Badge>Atualizando analise...</Badge> : null}
        </div>

        <TabsContent value={period} className="space-y-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-brand-500" />
            </div>
          ) : error ? (
            <div className="card-surface rounded-[1.5rem] border border-amber-100 bg-white/92 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <TriangleAlert className="h-5 w-5" />
                </div>
                <div className="space-y-3">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Nao foi possivel gerar o relatorio</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tente novamente para recarregar as analises clinicas deste periodo.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => void refetch()}>
                    Tentar de novo
                  </Button>
                </div>
              </div>
            </div>
          ) : !reportData || !hasEntries ? (
            <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-6 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <Badge variant="neutral">Sem dados clinicos suficientes</Badge>
                  <h2 className="text-xl font-semibold text-foreground">
                    Registre algumas dores para liberar os relatorios visuais
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Assim que houver registros neste periodo, o sistema vai montar evolucao da dor,
                    distribuicao por area, risco de crise e correlacoes clinicas.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/app/pain-log">Registrar dor</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="metric-grid grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Dor media"
                  value={`${formatDecimal(reportData.overview.averagePainLevel)}/10`}
                  hint={`${resolveTrendLabel(reportData.painEvolution.trend)} no periodo`}
                  trend={`${formatDecimal(reportData.painEvolution.change)} pts`}
                  tone={resolveTrendVariant(reportData.painEvolution.trend)}
                  icon={HeartPulse}
                />
                <StatCard
                  label="Registros capturados"
                  value={reportData.overview.recordedEntries.toString()}
                  hint={`${reportData.overview.recordedDays} dias com diario clinico`}
                  icon={Activity}
                />
                <StatCard
                  label="Cobertura da janela"
                  value={formatPercentage(reportData.overview.dataCoverageRate)}
                  hint={`${reportData.metadata.window.capturedDays}/${reportData.metadata.window.expectedDays} dias com dados`}
                  icon={Brain}
                />
                <StatCard
                  label="Risco medio de crise"
                  value={formatPercentage(reportData.overview.averageProbabilityScore)}
                  hint={resolveSourceLabel(reportData.crisisProbability.latestRiskSource)}
                  icon={ShieldAlert}
                />
              </div>

              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-brand-500">Linha do tempo</p>
                      <h2 className="mt-2 text-xl font-semibold md:text-2xl">Evolucao da dor por registro</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Cada ponto representa um registro salvo, inclusive multiplos registros no mesmo dia.
                      </p>
                    </div>
                    <Badge variant={resolveTrendVariant(reportData.painEvolution.trend)}>
                      {resolveTrendLabel(reportData.painEvolution.trend)}
                    </Badge>
                  </div>

                  {painTrendData.length > 0 ? (
                    <TrendLineChart data={painTrendData} secondaryKey="comparison" height={290} />
                  ) : (
                    <div className="flex h-[290px] items-center justify-center text-slate-400">
                      Sem registros suficientes para o grafico de dor.
                    </div>
                  )}
                </div>

                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5">
                    <p className="text-sm font-medium text-brand-500">Distribuicao clinica</p>
                    <h2 className="mt-2 text-xl font-semibold md:text-2xl">{distribution?.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{distribution?.description}</p>
                  </div>

                  {distributionData.length > 0 ? (
                    <>
                      <RingChart data={distributionData} />
                      <div className="mt-4 space-y-3">
                        {distributionData.map((item, index) => (
                          <div key={item.label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                                />
                                <span className="text-foreground">{item.label}</span>
                              </div>
                              <span className="text-muted-foreground">{formatPercentage(item.value)}</span>
                            </div>
                            <Progress value={item.value} />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-[290px] items-center justify-center text-slate-400">
                      Sem distribuicao suficiente neste periodo.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-brand-500">Recuperacao</p>
                      <h2 className="mt-2 text-xl font-semibold md:text-2xl">Sono no periodo</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Media de {formatDecimal(reportData.sleepEvolution.hours.average)} horas por registro.
                      </p>
                    </div>
                    <Badge variant={resolveTrendVariant(reportData.sleepEvolution.hours.trend)}>
                      {resolveTrendLabel(reportData.sleepEvolution.hours.trend)}
                    </Badge>
                  </div>

                  {sleepTrendData.length > 0 ? (
                    <TrendLineChart
                      data={sleepTrendData}
                      secondaryKey="comparison"
                      height={240}
                      color="#53A2FF"
                    />
                  ) : (
                    <div className="flex h-[240px] items-center justify-center text-slate-400">
                      Sem dados suficientes de sono.
                    </div>
                  )}
                </div>

                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-brand-500">Risco</p>
                      <h2 className="mt-2 text-xl font-semibold md:text-2xl">Probabilidade de crise</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Pico recente de {formatPercentage(reportData.crisisProbability.maxProbabilityScore)}.
                      </p>
                    </div>
                    <Badge variant={reportData.crisisProbability.maxProbabilityScore >= 70 ? 'warning' : 'default'}>
                      {reportData.crisisProbability.highRiskDays} dias de alto risco
                    </Badge>
                  </div>

                  {probabilityTrendData.length > 0 ? (
                    <TrendLineChart
                      data={probabilityTrendData}
                      secondaryKey="comparison"
                      height={240}
                      color="#F46EA3"
                    />
                  ) : (
                    <div className="flex h-[240px] items-center justify-center text-slate-400">
                      Sem dados suficientes de probabilidade.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5">
                    <p className="text-sm font-medium text-brand-500">Padroes predominantes</p>
                    <h2 className="mt-2 text-xl font-semibold">Tipos e gatilhos</h2>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Sparkles className="h-4 w-4 text-brand-500" />
                        Tipos mais frequentes
                      </div>
                      {reportData.painPatterns.types.length > 0 ? (
                        reportData.painPatterns.types.map((item) => (
                          <div key={item.label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>{item.label}</span>
                              <span className="text-muted-foreground">
                                {item.occurrences} registros
                              </span>
                            </div>
                            <Progress value={item.percentage} />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Sem tipos de dor informados.</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <TriangleAlert className="h-4 w-4 text-amber-500" />
                        Gatilhos mais citados
                      </div>
                      {reportData.painPatterns.triggers.length > 0 ? (
                        reportData.painPatterns.triggers.map((item) => (
                          <div key={item.label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>{item.label}</span>
                              <span className="text-muted-foreground">
                                {formatPercentage(item.percentage)}
                              </span>
                            </div>
                            <Progress value={item.percentage} />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Sem gatilhos informados neste periodo.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5">
                    <p className="text-sm font-medium text-brand-500">Sinais de alerta</p>
                    <h2 className="mt-2 text-xl font-semibold">Gatilhos recorrentes</h2>
                  </div>

                  <div className="space-y-4">
                    {reportData.recurringTriggers.length > 0 ? (
                      reportData.recurringTriggers.map((item) => (
                        <div key={item.key} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-foreground">{item.label}</p>
                            <Badge variant={item.highRiskRate >= 50 ? 'warning' : 'default'}>
                              {formatPercentage(item.highRiskRate)}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{item.evidence}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Ainda nao foi possivel identificar gatilhos recorrentes confiaveis.
                      </p>
                    )}
                  </div>
                </div>

                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5">
                    <p className="text-sm font-medium text-brand-500">Leitura clinica</p>
                    <h2 className="mt-2 text-xl font-semibold">Correlacoes principais</h2>
                  </div>

                  <div className="space-y-4">
                    {reportData.correlations.length > 0 ? (
                      reportData.correlations.map((item) => (
                        <div key={item.key} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {resolveMetricLabel(item.leftMetric)} x {resolveMetricLabel(item.rightMetric)}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">{item.insight}</p>
                            </div>
                            <Badge
                              variant={
                                item.direction === 'positive'
                                  ? 'warning'
                                  : item.direction === 'negative'
                                    ? 'success'
                                    : 'default'
                              }
                            >
                              {formatDecimal(item.coefficient, 2)}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Ainda nao ha amostra suficiente para calcular correlacoes robustas.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-500">Camada personalizada</p>
                    <h2 className="mt-2 text-xl font-semibold md:text-2xl">Perfil de risco individual</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Leitura derivada do historico recente para destacar o que mais pesa no seu caso.
                    </p>
                  </div>

                  <Badge variant={reportData.personalizedRiskProfile.available ? 'success' : 'neutral'}>
                    {reportData.personalizedRiskProfile.available ? 'Analise disponivel' : 'Aguardando mais dados'}
                  </Badge>
                </div>

                {reportData.personalizedRiskProfile.available ? (
                  <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <StatCard
                          label="Score atual"
                          value={formatPercentage(reportData.personalizedRiskProfile.currentPersonalizedScore ?? 0)}
                          icon={ShieldAlert}
                        />
                        <StatCard
                          label="Baseline"
                          value={formatPercentage(reportData.personalizedRiskProfile.baselineScore ?? 0)}
                          icon={MoonStar}
                        />
                        <StatCard
                          label="Ultima analise"
                          value={formatDateTime(reportData.personalizedRiskProfile.lastAnalyzedAt)}
                          icon={Brain}
                        />
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                        <p className="text-sm font-medium text-foreground">Resumo personalizado</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {reportData.personalizedRiskProfile.summary ??
                            'A IA ainda esta consolidando um resumo individual com base no seu historico.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                        <p className="text-sm font-medium text-foreground">Padroes antes de crise</p>
                        <div className="mt-4 space-y-3">
                          {reportData.personalizedRiskProfile.triggerPatterns.length > 0 ? (
                            reportData.personalizedRiskProfile.triggerPatterns.map((item) => (
                              <div key={item.key} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>{item.label}</span>
                                  <span className="text-muted-foreground">
                                    {formatPercentage(item.occurrenceRateBeforeCrisis)}
                                  </span>
                                </div>
                                <Progress value={item.occurrenceRateBeforeCrisis} />
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Ainda nao foram detectados padroes personalizados antes de crise.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                        <p className="text-sm font-medium text-foreground">Pesos mais relevantes</p>
                        <div className="mt-4 space-y-3">
                          {reportData.personalizedRiskProfile.topWeights.length > 0 ? (
                            reportData.personalizedRiskProfile.topWeights.map((item) => (
                              <div key={item.key} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>{item.label}</span>
                                  <span className="text-muted-foreground">
                                    x{formatDecimal(item.personalizedWeight, 2)}
                                  </span>
                                </div>
                                <Progress value={Math.min(item.personalizedWeight * 100, 100)} />
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Ainda nao ha pesos personalizados suficientes para exibir.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-muted-foreground">
                    O perfil personalizado aparece automaticamente quando o sistema acumula historico clinico
                    suficiente para aprender o comportamento individual da dor e dos gatilhos.
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
