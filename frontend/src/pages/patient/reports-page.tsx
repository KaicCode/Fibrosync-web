import {
  Activity,
  Brain,
  Download,
  HeartPulse,
  LoaderCircle,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { RingChart } from "@/components/charts/ring-chart";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolvePainDescriptor } from "@/features/clinical/clinical-model";
import {
  buildDailyAggregates,
  buildTimelineSeries,
  resolveDateWindow,
  type DashboardRangeDays,
} from "@/features/clinical/record-analytics";
import { useDailyRecords } from "@/hooks/useDailyRecords";
import { usePageTitle } from "@/hooks/use-page-title";
import { useReports } from "@/hooks/useReports";
import type {
  ReportPatternItem,
  ReportPeriod,
  ReportResponse,
  ReportStructuredData,
  ReportTrend,
} from "@/services/report.service";
import { useMemo, useState } from "react";

const chartColors = [
  "#7B4DFF",
  "#FF9A4D",
  "#53A2FF",
  "#7ED7B1",
  "#F46EA3",
  "#FFC857",
];

function formatDecimal(value: number, digits = 1): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Ainda nao gerado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function resolveTrendLabel(trend: ReportTrend): string {
  if (trend === "improving") {
    return "Em melhora";
  }

  if (trend === "worsening") {
    return "Em piora";
  }

  return "Sem mudanca relevante";
}

function resolveTrendVariant(
  trend: ReportTrend,
): "default" | "success" | "warning" {
  if (trend === "improving") {
    return "success";
  }

  if (trend === "worsening") {
    return "warning";
  }

  return "default";
}

function resolvePeriodLabel(period: ReportPeriod): string {
  if (period === "weekly") {
    return "Semana";
  }

  if (period === "quarterly") {
    return "90 dias";
  }

  return "Mes";
}

function resolvePeriodDays(period: ReportPeriod): DashboardRangeDays {
  if (period === "weekly") {
    return 7;
  }

  if (period === "quarterly") {
    return 90;
  }

  return 30;
}

function resolvePainTrendSummary(trend: ReportTrend): string {
  if (trend === "improving") {
    return "A dor diminuiu neste periodo.";
  }

  if (trend === "worsening") {
    return "A dor aumentou neste periodo.";
  }

  return "Sem mudanca relevante neste periodo.";
}

function formatCount(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatTrackedDaysSummary(recordedDays: number, expectedDays: number): string {
  return `Voce registrou informacoes em ${recordedDays} dos ultimos ${expectedDays} dias.`;
}

function formatPointChange(change: number): string {
  const absoluteChange = Math.abs(change);
  const unit = absoluteChange > 1 ? "pontos" : "ponto";

  return `${formatDecimal(absoluteChange)} ${unit}`;
}

function resolveAttentionLevel(score: number): {
  label: string;
  description: string;
  variant: "default" | "success" | "warning";
} {
  if (score >= 85) {
    return {
      label: "Muito elevada",
      description:
        "Seus registros mostram um periodo que pede mais cuidado, pausas e observacao dos sintomas.",
      variant: "warning",
    };
  }

  if (score >= 65) {
    return {
      label: "Elevada",
      description:
        "Seus registros indicam que seus sintomas merecem mais atencao neste periodo.",
      variant: "warning",
    };
  }

  if (score >= 40) {
    return {
      label: "Moderada",
      description:
        "Seus registros mostram sinais que valem acompanhamento ao longo deste periodo.",
      variant: "default",
    };
  }

  return {
    label: "Baixa",
    description:
      "Seus registros sugerem um periodo mais estavel, mantendo o acompanhamento habitual.",
    variant: "success",
  };
}

function resolvePeakAttentionSummary(score: number): string {
  return `O maior nivel de atencao identificado neste periodo foi ${resolveAttentionLevel(score).label.toLowerCase()}.`;
}

function resolveHighAttentionDaysLabel(highRiskDays: number): string {
  if (highRiskDays === 0) {
    return "Nenhum dia com atencao elevada";
  }

  return `${formatCount(highRiskDays, "dia", "dias")} com atencao elevada`;
}

function formatReadableNumber(value: number, digits = 1): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : digits,
    maximumFractionDigits: digits,
  });
}

function resolveMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    painLevel: "Dor",
    sleepHours: "Sono",
    fatigueLevel: "Fadiga",
    stressLevel: "Estresse",
    moodLevel: "Humor",
    hydration: "Hidratacao",
    physicalActivity: "Atividade",
    crisisProbability: "Atencao aos sintomas",
    symptomLoad: "Carga de sintomas",
    temperature: "Temperatura",
    humidity: "Umidade",
    apparentTemperature: "Sensacao termica",
    precipitation: "Chuva",
    pressure: "Pressao",
    windSpeed: "Vento",
  };

  return labels[metric] ?? metric;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function analyzeMetricTrend(
  points: Array<{ value: number | null }>,
  higherIsBetter: boolean,
  stableThreshold: number,
): { change: number | null; trend: ReportTrend | null } {
  const values = points
    .map((point) => point.value)
    .filter((value): value is number => typeof value === "number");

  if (values.length < 2) {
    return {
      change: null,
      trend: null,
    };
  }

  const midpoint = Math.ceil(values.length / 2);
  const firstHalf = values.slice(0, midpoint);
  const secondHalf = values.slice(midpoint);
  const baseline = average(firstHalf);
  const comparisonBase = average(secondHalf);

  if (baseline === null || comparisonBase === null) {
    return {
      change: null,
      trend: null,
    };
  }

  const change = Number((comparisonBase - baseline).toFixed(1));

  if (Math.abs(change) < stableThreshold) {
    return {
      change,
      trend: "stable",
    };
  }

  if (higherIsBetter) {
    return {
      change,
      trend: change > 0 ? "improving" : "worsening",
    };
  }

  return {
    change,
    trend: change < 0 ? "improving" : "worsening",
  };
}

function buildRingData(items: ReportPatternItem[]) {
  return items.map((item, index) => ({
    label: item.label,
    value: Number(item.percentage.toFixed(1)),
    color: chartColors[index % chartColors.length],
    fill: chartColors[index % chartColors.length],
  }));
}

function resolveDistribution(data: ReportStructuredData) {
  if (data.painPatterns.areas.length > 0) {
    return {
      title: "Areas com mais recorrencia",
      description: "Percentual de registros em que cada area apareceu.",
      items: data.painPatterns.areas,
    };
  }

  if (data.painPatterns.triggers.length > 0) {
    return {
      title: "Gatilhos mais citados",
      description: "Percentual de registros em que cada gatilho apareceu.",
      items: data.painPatterns.triggers,
    };
  }

  return {
    title: "Tipos de dor mais frequentes",
    description: "Percentual de registros em que cada tipo de dor apareceu.",
    items: data.painPatterns.types,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function openPrintableReport(report: ReportResponse) {
  if (typeof window === "undefined" || !report.data) {
    return;
  }

  const reportData = report.data;
  const distribution = resolveDistribution(reportData);
  const painDescriptor = resolvePainDescriptor(reportData.overview.averagePainLevel);
  const attentionLevel = resolveAttentionLevel(
    reportData.overview.averageProbabilityScore,
  );
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    return;
  }

  const metrics = [
    [
      "Dor media no periodo",
      `${formatDecimal(reportData.overview.averagePainLevel)}/10 (${painDescriptor.label})`,
    ],
    ["Dias registrados", `${reportData.overview.recordedDays}`],
    [
      "Acompanhamento no periodo",
      `${reportData.metadata.window.capturedDays} de ${reportData.metadata.window.expectedDays} dias`,
    ],
    ["Atencao aos sintomas", attentionLevel.label],
  ];

  const listToHtml = (items: string[]) =>
    items.length > 0
      ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "<p>Sem dados suficientes neste periodo.</p>";

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
        <h1>Relatorio do seu acompanhamento</h1>
        <p class="muted">
          Periodo ${escapeHtml(resolvePeriodLabel(report.period))} | ${escapeHtml(formatLongDate(report.periodStart))} ate ${escapeHtml(formatLongDate(report.periodEnd))}
        </p>
        <p class="muted">Gerado em ${escapeHtml(formatDateTime(report.generatedAt))}</p>

        <div class="grid">
          ${metrics
            .map(
              ([label, value]) =>
                `<div class="card"><strong>${escapeHtml(label)}</strong><div>${escapeHtml(value)}</div></div>`,
            )
            .join("")}
        </div>

        <h2>Padroes mais frequentes</h2>
        ${listToHtml(
          distribution.items.map(
            (item) =>
              `${item.label}: ${formatPercentage(item.percentage)} dos registros (${item.occurrences} ocorrencias)`,
          ),
        )}

        <h2>Gatilhos recorrentes</h2>
        ${listToHtml(
          reportData.recurringTriggers.map(
            (item) =>
              `${item.label}: ${formatPercentage(item.highRiskRate)} dos dias com atencao elevada`,
          ),
        )}

        <h2>Relacoes percebidas nos registros</h2>
        ${listToHtml(
          reportData.correlations.map(
            (item) =>
              `${resolveMetricLabel(item.leftMetric)} x ${resolveMetricLabel(item.rightMetric)}: coeficiente ${formatDecimal(item.coefficient, 2)} (${item.direction})`,
          ),
        )}
      </body>
    </html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function ReportsPage() {
  usePageTitle("Relatorios");
  const [period, setPeriod] = useState<ReportPeriod>("weekly");
  const { report, error, isLoading, isFetching, refetch } = useReports(period);
  const periodDays = useMemo(() => resolvePeriodDays(period), [period]);
  const fallbackWindow = useMemo(() => resolveDateWindow(periodDays), [periodDays]);
  const reportWindow = useMemo(
    () => ({
      dateFrom: report?.periodStart ?? fallbackWindow.dateFrom,
      dateTo: report?.periodEnd ?? fallbackWindow.dateTo,
    }),
    [fallbackWindow.dateFrom, fallbackWindow.dateTo, report?.periodEnd, report?.periodStart],
  );
  const { records: reportRecords, isLoading: isLoadingTimelineRecords } =
    useDailyRecords({
      ...reportWindow,
      includeAll: true,
    });

  const reportData = report?.data ?? null;
  const hasEntries = (reportData?.overview.recordedEntries ?? 0) > 0;
  const recordAggregates = useMemo(
    () => buildDailyAggregates(reportRecords),
    [reportRecords],
  );
  const aggregatesByDate = useMemo(
    () => new Map(recordAggregates.map((day) => [day.date, day])),
    [recordAggregates],
  );
  const probabilityByDate = useMemo(
    () =>
      new Map(
        (reportData?.crisisProbability.dailySeries ?? []).map((point) => [
          point.date,
          point,
        ]),
      ),
    [reportData?.crisisProbability.dailySeries],
  );
  const distribution = reportData ? resolveDistribution(reportData) : null;
  const distributionData = distribution
    ? buildRingData(distribution.items)
    : [];
  const painTrendData = useMemo(
    () =>
      buildTimelineSeries(reportWindow.dateFrom, reportWindow.dateTo, (dateKey) => {
        const day = aggregatesByDate.get(dateKey);

        return {
          value: day?.painAverage ?? null,
        };
      }),
    [aggregatesByDate, reportWindow.dateFrom, reportWindow.dateTo],
  );
  const sleepTrendData = useMemo(
    () =>
      buildTimelineSeries(reportWindow.dateFrom, reportWindow.dateTo, (dateKey) => {
        const day = aggregatesByDate.get(dateKey);

        return {
          value: day?.sleepHoursAverage ?? null,
        };
      }),
    [aggregatesByDate, reportWindow.dateFrom, reportWindow.dateTo],
  );
  const probabilityTrendData = useMemo(
    () =>
      buildTimelineSeries(reportWindow.dateFrom, reportWindow.dateTo, (dateKey) => {
        const point = probabilityByDate.get(dateKey);

        return {
          value: point?.combinedProbabilityScore ?? null,
        };
      }),
    [probabilityByDate, reportWindow.dateFrom, reportWindow.dateTo],
  );
  const averagePainLevel = useMemo(
    () => average(recordAggregates.map((day) => day.painAverage)),
    [recordAggregates],
  );
  const averageSleepHours = useMemo(
    () =>
      average(
        recordAggregates
          .map((day) => day.sleepHoursAverage)
          .filter((value): value is number => typeof value === "number"),
      ),
    [recordAggregates],
  );
  const painTrend = useMemo(
    () => analyzeMetricTrend(painTrendData, false, 0.4),
    [painTrendData],
  );
  const sleepTrend = useMemo(
    () => analyzeMetricTrend(sleepTrendData, true, 0.35),
    [sleepTrendData],
  );
  const hasAttentionData = useMemo(
    () =>
      probabilityTrendData.some((point) => typeof point.value === "number"),
    [probabilityTrendData],
  );
  const attentionAverage = hasAttentionData
    ? reportData?.overview.averageProbabilityScore ?? null
    : null;
  const attentionLevel = attentionAverage !== null
    ? resolveAttentionLevel(attentionAverage)
    : null;
  const painDescriptor = averagePainLevel !== null
    ? resolvePainDescriptor(averagePainLevel)
    : null;
  const isPageLoading = isLoading || isLoadingTimelineRecords;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Seus registros"
        title="Relatorio do seu acompanhamento"
        description="Veja como sua dor e outros sinais apareceram ao longo do periodo com base no que voce registrou."
        actions={
          <Button
            variant="secondary"
            disabled={!reportData || !hasEntries}
            onClick={() => {
              if (report) {
                openPrintableReport(report);
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        }
      />

      <Tabs
        value={period}
        onValueChange={(value) => setPeriod(value as ReportPeriod)}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="weekly">Semana</TabsTrigger>
            <TabsTrigger value="monthly">Mes</TabsTrigger>
            <TabsTrigger value="quarterly">90 dias</TabsTrigger>
          </TabsList>

          {isFetching && !isPageLoading ? (
            <Badge>Atualizando relatorio...</Badge>
          ) : null}
        </div>

        <TabsContent value={period} className="space-y-6">
          {isPageLoading ? (
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
                    <h2 className="text-xl font-semibold text-foreground">
                      Nao foi possivel abrir seu relatorio
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tente novamente para recarregar o resumo deste periodo.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => void refetch()}>
                    Tentar de novo
                  </Button>
                </div>
              </div>
            </div>
          ) : !reportData ? (
            <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-6 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <Badge variant="neutral">Relatorio indisponivel</Badge>
                  <h2 className="text-xl font-semibold text-foreground">
                    Nao foi possivel carregar os dados deste periodo
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tente novamente em alguns instantes para atualizar seu
                    acompanhamento.
                  </p>
                </div>
                <Button variant="outline" onClick={() => void refetch()}>
                  Tentar de novo
                </Button>
              </div>
            </div>
          ) : (
            <>
              {!hasEntries ? (
                <div className="rounded-[1.4rem] border border-dashed border-violet-200 bg-violet-50/70 px-4 py-3 text-sm text-violet-950">
                  Ainda nao ha registros neste periodo. Os graficos abaixo
                  continuam visiveis para mostrar como seu acompanhamento vai
                  aparecer quando voce comecar a registrar.
                </div>
              ) : null}

              <div className="metric-grid grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Dor media no periodo"
                  value={
                    averagePainLevel !== null
                      ? `${formatDecimal(averagePainLevel)}/10`
                      : "--"
                  }
                  hint={
                    painDescriptor?.label ??
                    "Ainda nao ha registros de dor neste periodo."
                  }
                  footer={
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {averagePainLevel !== null ? (
                        <>
                          {painTrend.trend !== null ? (
                            <>
                              <p>{resolvePainTrendSummary(painTrend.trend)}</p>
                              <p>
                                Variacao: {formatPointChange(painTrend.change ?? 0)}
                              </p>
                            </>
                          ) : (
                            <p>
                              Voce possui apenas 1 registro neste periodo.
                              Continue registrando para acompanhar sua evolucao.
                            </p>
                          )}
                        </>
                      ) : (
                        <p>
                          Registre como voce esta se sentindo para visualizar sua
                          evolucao.
                        </p>
                      )}
                    </div>
                  }
                  icon={HeartPulse}
                />
                <StatCard
                  label="Dias registrados"
                  value={reportData.overview.recordedDays.toString()}
                  hint={formatTrackedDaysSummary(
                    reportData.overview.recordedDays,
                    reportData.metadata.window.expectedDays,
                  )}
                  icon={Activity}
                />
                <StatCard
                  label="Acompanhamento no periodo"
                  value={`${reportData.metadata.window.capturedDays} de ${reportData.metadata.window.expectedDays} dias`}
                  hint="Dias em que voce registrou como estava se sentindo."
                  footer={
                    <div className="space-y-3">
                      <Progress value={reportData.overview.dataCoverageRate} />
                      <p className="text-sm text-muted-foreground">
                        Quanto mais dias voce registrar, mais completo fica seu
                        acompanhamento.
                      </p>
                    </div>
                  }
                  icon={Brain}
                />
                <StatCard
                  label="Atencao aos sintomas"
                  value={attentionLevel?.label ?? "Sem dados"}
                  hint={
                    attentionLevel?.description ??
                    "Registre como voce esta se sentindo para acompanhar este indicador."
                  }
                  tone={attentionLevel?.variant ?? "default"}
                  footer={
                    <p className="text-sm text-muted-foreground">
                      {attentionLevel
                        ? "Leitura baseada no que voce registrou neste periodo."
                        : "O nivel de atencao aparece conforme seus registros forem surgindo."}
                    </p>
                  }
                  icon={ShieldAlert}
                />
              </div>

              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-brand-500">
                        Linha do tempo
                      </p>
                      <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                        Como sua dor variou no periodo
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Cada ponto resume um dia em que voce registrou como
                        estava se sentindo.
                      </p>
                    </div>
                    {painTrend.trend !== null ? (
                      <Badge variant={resolveTrendVariant(painTrend.trend)}>
                        {resolveTrendLabel(painTrend.trend)}
                      </Badge>
                    ) : (
                      <Badge variant="neutral">Ainda conhecendo</Badge>
                    )}
                  </div>

                  <TrendLineChart
                    data={painTrendData}
                    height={290}
                    primaryLabel="Dor"
                    yDomain={[0, 10]}
                    yTicks={[0, 2, 4, 6, 8, 10]}
                    valueFormatter={(value) => `${formatDecimal(value)}/10`}
                    emptyState={{
                      title: "Ainda nao ha registros neste periodo.",
                      description:
                        "Registre como voce esta se sentindo para acompanhar sua evolucao ao longo do tempo.",
                    }}
                    singleRecordState={{
                      title: "Voce possui apenas 1 registro neste periodo.",
                      description:
                        "Continue registrando para visualizar melhor sua evolucao.",
                    }}
                  />
                </div>

                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5">
                    <p className="text-sm font-medium text-brand-500">
                      Padroes dos seus registros
                    </p>
                    <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                      {distribution?.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {distribution?.description}
                    </p>
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
                                  style={{
                                    backgroundColor:
                                      chartColors[index % chartColors.length],
                                  }}
                                />
                                <span className="text-foreground">
                                  {item.label}
                                </span>
                              </div>
                              <span className="text-muted-foreground">
                                {formatPercentage(item.value)}
                              </span>
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
                      <p className="text-sm font-medium text-brand-500">
                        Recuperacao
                      </p>
                      <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                        Sono no periodo
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {averageSleepHours !== null
                          ? `Media de ${formatReadableNumber(averageSleepHours)} horas por dia com registro.`
                          : "Quando houver registros de sono, voce vera sua evolucao aqui."}
                      </p>
                    </div>
                    {sleepTrend.trend !== null ? (
                      <Badge variant={resolveTrendVariant(sleepTrend.trend)}>
                        {resolveTrendLabel(sleepTrend.trend)}
                      </Badge>
                    ) : (
                      <Badge variant="neutral">Ainda conhecendo</Badge>
                    )}
                  </div>

                  <TrendLineChart
                    data={sleepTrendData}
                    height={240}
                    color="#3A8DFF"
                    primaryLabel="Sono"
                    yDomain={[0, 24]}
                    yTicks={[0, 4, 8, 12, 16, 20, 24]}
                    yTickFormatter={(value) => `${value}h`}
                    yAxisWidth={40}
                    valueFormatter={(value) => `${formatReadableNumber(value)}h`}
                    emptyState={{
                      title: "Ainda nao ha registros de sono neste periodo.",
                      description:
                        "Assim que voce registrar seu sono, este grafico mostrara a evolucao das horas dormidas.",
                    }}
                    singleRecordState={{
                      title:
                        "Voce possui apenas 1 registro de sono neste periodo.",
                      description:
                        "Continue registrando para comparar melhor suas horas de sono ao longo do tempo.",
                    }}
                  />
                </div>

                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-brand-500">
                        Acompanhamento
                      </p>
                      <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                        Atencao aos sintomas ao longo do periodo
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {hasAttentionData
                          ? resolvePeakAttentionSummary(
                              reportData.crisisProbability.maxProbabilityScore,
                            )
                          : "Ainda nao ha registros suficientes para identificar um nivel de atencao neste periodo."}
                      </p>
                    </div>
                    <Badge
                      variant={
                        !hasAttentionData
                          ? "neutral"
                          : reportData.crisisProbability.maxProbabilityScore >= 70
                          ? "warning"
                          : "default"
                      }
                    >
                      {hasAttentionData
                        ? resolveHighAttentionDaysLabel(
                            reportData.crisisProbability.highRiskDays,
                          )
                        : "Sem dados suficientes"}
                    </Badge>
                  </div>

                  <TrendLineChart
                    data={probabilityTrendData}
                    height={240}
                    color="#E2558F"
                    primaryLabel="Nivel de atencao"
                    yDomain={[0, 100]}
                    yTicks={[0, 25, 50, 75, 100]}
                    yTickFormatter={(value) => `${value}%`}
                    yAxisWidth={40}
                    valueFormatter={(value) => `${formatPercentage(value)}`}
                    tooltipValueFormatter={(value) =>
                      `${resolveAttentionLevel(value).label} (${formatPercentage(value)})`
                    }
                    emptyState={{
                      title: "Ainda nao ha registros neste periodo.",
                      description:
                        "Quando seus registros aparecerem, este grafico vai mostrar como o nivel de atencao mudou ao longo dos dias.",
                    }}
                    singleRecordState={{
                      title: "Voce possui apenas 1 registro neste periodo.",
                      description:
                        "Continue registrando para acompanhar melhor a variacao deste indicador.",
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5">
                    <p className="text-sm font-medium text-brand-500">
                      Padroes predominantes
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      Tipos e gatilhos
                    </h2>
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
                        <p className="text-sm text-muted-foreground">
                          Sem tipos de dor informados.
                        </p>
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
                        <p className="text-sm text-muted-foreground">
                          Sem gatilhos informados neste periodo.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5">
                    <p className="text-sm font-medium text-brand-500">
                      Sinais de alerta
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      Gatilhos recorrentes
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {reportData.recurringTriggers.length > 0 ? (
                      reportData.recurringTriggers.map((item) => (
                        <div
                          key={item.key}
                          className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-foreground">
                              {item.label}
                            </p>
                            <Badge
                              variant={
                                item.highRiskRate >= 50 ? "warning" : "default"
                              }
                            >
                              {formatPercentage(item.highRiskRate)}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {item.evidence}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Ainda nao foi possivel identificar gatilhos recorrentes
                        confiaveis.
                      </p>
                    )}
                  </div>
                </div>

                <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5">
                    <p className="text-sm font-medium text-brand-500">
                      Leitura clinica
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      Correlacoes principais
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {reportData.correlations.length > 0 ? (
                      reportData.correlations.map((item) => (
                        <div
                          key={item.key}
                          className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {resolveMetricLabel(item.leftMetric)} x{" "}
                                {resolveMetricLabel(item.rightMetric)}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {item.insight}
                              </p>
                            </div>
                            <Badge
                              variant={
                                item.direction === "positive"
                                  ? "warning"
                                  : item.direction === "negative"
                                    ? "success"
                                    : "default"
                              }
                            >
                              {formatDecimal(item.coefficient, 2)}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Ainda nao ha amostra suficiente para calcular
                        correlacoes robustas.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Secao personalizada ocultada temporariamente ate termos uma
              versao mais clara para pacientes. */}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
