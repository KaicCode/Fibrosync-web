import { useMemo, useState } from "react";
import {
  Activity,
  Brain,
  CloudSun,
  HeartPulse,
  LoaderCircle,
  MoonStar,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Waves,
} from "lucide-react";
import { Link } from "react-router-dom";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildDailyAggregates,
  buildFrequency,
  resolveDateWindow,
  type DashboardRangeDays,
} from "@/features/clinical/record-analytics";
import { useDailyRecords } from "@/hooks/useDailyRecords";
import { usePageTitle } from "@/hooks/use-page-title";
import { usePrediction } from "@/hooks/usePrediction";
import { useUser } from "@/hooks/useUser";
import { useCurrentLocation, useWeather } from "@/hooks/useWeather";

const rangeOptions: DashboardRangeDays[] = [7, 30, 90];

function formatChartLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(new Date(value));
}

function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function resolvePainState(painLevel: number): string {
  if (painLevel >= 8) {
    return "Dor muito alta";
  }

  if (painLevel >= 6) {
    return "Dor alta";
  }

  if (painLevel >= 3) {
    return "Dor moderada";
  }

  return "Dor controlada";
}

function resolveReliabilityVariant(
  score: number,
): "default" | "success" | "warning" {
  if (score >= 71) {
    return "success";
  }

  if (score >= 41) {
    return "default";
  }

  return "warning";
}

export function DashboardPage() {
  usePageTitle("Dashboard");

  const { user } = useUser();
  const [rangeDays, setRangeDays] = useState<DashboardRangeDays>(30);
  const windowRange = useMemo(() => resolveDateWindow(rangeDays), [rangeDays]);
  const { records, isLoading: isLoadingRecords } = useDailyRecords({
    ...windowRange,
    includeAll: true,
  });
  const {
    latestRulePrediction,
    latestAiPrediction,
    isLoadingLatest,
    isLoadingLatestAi,
  } = usePrediction();
  const {
    coordinates,
    status: locationStatus,
    errorMessage: locationError,
    requestLocation,
  } = useCurrentLocation();
  const {
    weather,
    conditionLabel,
    impactMessage,
    sourceLabel,
    isWeatherRiskElevated,
    isLoading: isLoadingWeather,
    refetch: refetchWeather,
  } = useWeather(coordinates?.lat, coordinates?.lon);

  const aggregates = useMemo(() => buildDailyAggregates(records), [records]);
  const latestDay = aggregates.at(-1) ?? null;
  const latestRecord = latestDay?.latestRecord ?? null;
  const trendSeries = useMemo(
    () =>
      aggregates.map((day) => ({
        label: formatChartLabel(day.date),
        value: day.painAverage,
        comparison: day.stressAverage,
      })),
    [aggregates],
  );

  const topAreas = useMemo(
    () => buildFrequency(records.flatMap((record) => record.painAreas)).slice(0, 4),
    [records],
  );
  const topTriggers = useMemo(
    () =>
      buildFrequency(records.flatMap((record) => record.painTriggers)).slice(0, 4),
    [records],
  );

  const averagePain = useMemo(
    () =>
      aggregates.length > 0
        ? aggregates.reduce((sum, day) => sum + day.painAverage, 0) /
          aggregates.length
        : 0,
    [aggregates],
  );
  const peakDay = useMemo(
    () =>
      aggregates.reduce<typeof aggregates[number] | null>((highest, day) => {
        if (!highest || day.painPeak > highest.painPeak) {
          return day;
        }

        return highest;
      }, null),
    [aggregates],
  );
  const averageReliability = useMemo(() => {
    const scores = aggregates
      .map((day) => day.reliabilityAverage)
      .filter((value): value is number => typeof value === "number");

    if (scores.length === 0) {
      return 0;
    }

    return Number(
      (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1),
    );
  }, [aggregates]);

  const isLoading = isLoadingRecords || isLoadingLatest;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow={`Ola, ${user?.fullName?.split(" ")[0] || "Paciente"}`}
          title="Panorama clinico da sua rotina"
          description="Estamos reunindo dor, contexto e sinais do corpo para montar o painel mais recente."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <Skeleton className="h-[24rem] w-full" />
          <div className="space-y-5">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={`Ola, ${user?.fullName?.split(" ")[0] || "Paciente"}`}
        title="Panorama clinico da sua fibromialgia"
        description="Os indicadores abaixo usam agregacao diaria por periodo para mostrar comportamento recente da dor, confiabilidade do dado e contexto corporal real."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {rangeOptions.map((option) => (
              <Button
                key={option}
                variant={rangeDays === option ? "default" : "secondary"}
                size="sm"
                onClick={() => setRangeDays(option)}
              >
                {option} dias
              </Button>
            ))}
            <Button asChild variant="secondary" size="sm">
              <Link to="/app/pain-log">Novo registro</Link>
            </Button>
          </div>
        }
      />

      <div className="metric-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Dor mais recente"
          value={`${latestRecord?.painLevel ?? 0}/10`}
          hint={latestRecord ? resolvePainState(latestRecord.painLevel) : "Sem registros no periodo"}
          icon={HeartPulse}
        />
        <StatCard
          label="Media recente"
          value={`${formatNumber(averagePain)}/10`}
          hint={`Media diaria dos ultimos ${rangeDays} dias`}
          icon={TrendingUp}
        />
        <StatCard
          label="Pico recente"
          value={`${peakDay?.painPeak ?? 0}/10`}
          hint={peakDay ? formatLongDate(peakDay.date) : "Sem historico"}
          icon={Activity}
        />
        <StatCard
          label="Confiabilidade"
          value={`${formatNumber(averageReliability)}%`}
          hint={
            latestRecord?.dataReliabilityLabel ??
            "Sem confiabilidade calculada ainda"
          }
          icon={ShieldAlert}
          tone={resolveReliabilityVariant(averageReliability)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div className="space-y-5">
          <div className="panel-surface p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Evolucao diaria</p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Evolucao das ultimas ocorrencias
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Linha principal: media diaria da dor. Linha de comparacao:
                  estresse medio do mesmo dia.
                </p>
              </div>
              <Badge variant="neutral">
                {windowRange.dateFrom} ate {windowRange.dateTo}
              </Badge>
            </div>

            {trendSeries.length > 0 ? (
              <TrendLineChart
                data={trendSeries}
                secondaryKey="comparison"
                height={300}
              />
            ) : (
              <div className="flex h-[18rem] items-center justify-center rounded-[1.6rem] border border-dashed border-violet-200 bg-white/72 px-6 text-center text-sm text-muted-foreground">
                Ainda nao ha registros suficientes nesse periodo para montar a
                evolucao diaria.
              </div>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="panel-surface p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <Waves className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Areas mais citadas
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Frequencia considerando todos os registros do periodo.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {topAreas.length > 0 ? (
                  topAreas.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-foreground">
                          {item.label}
                        </span>
                        <span className="text-muted-foreground">
                          {item.count} citacoes
                        </span>
                      </div>
                      <Progress value={item.percentage} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sem areas suficientes para ranking neste recorte.
                  </p>
                )}
              </div>
            </div>

            <div className="panel-surface p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Gatilhos mais citados
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ranking baseado no que voce realmente marcou.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {topTriggers.length > 0 ? (
                  topTriggers.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-foreground">
                          {item.label}
                        </span>
                        <span className="text-muted-foreground">
                          {item.count} citacoes
                        </span>
                      </div>
                      <Progress value={item.percentage} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum gatilho foi citado nesse periodo.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="panel-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <CloudSun className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Como o tempo pode afetar hoje
                </p>
                <p className="text-sm text-muted-foreground">
                  Leitura do clima atual separada do motor clinico.
                </p>
              </div>
            </div>

            {locationStatus === "loading" || isLoadingWeather ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : weather ? (
              <div className="space-y-4">
                <div className="rounded-[1.4rem] border border-white/80 bg-white/84 p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-3xl font-semibold text-foreground">
                        {Math.round(weather.temperature)}°C
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {conditionLabel}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={
                          isWeatherRiskElevated ? "warning" : "success"
                        }
                      >
                        {isWeatherRiskElevated ? "Maior impacto" : "Impacto menor"}
                      </Badge>
                      {sourceLabel ? (
                        <Badge variant="neutral">{sourceLabel}</Badge>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {impactMessage}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => void refetchWeather()}>
                  Atualizar clima
                </Button>
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-violet-200 bg-white/84 p-4">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 text-violet-600" />
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {locationError ??
                        "Nao conseguimos carregar o clima agora. O dashboard continua funcional mesmo sem essa leitura."}
                    </p>
                    <Button variant="secondary" size="sm" onClick={requestLocation}>
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="panel-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <MoonStar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Contexto atual
                </p>
                <p className="text-sm text-muted-foreground">
                  Ultimo registro real que alimenta risco e relatorios.
                </p>
              </div>
            </div>

            {latestRecord ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-surface p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Sono
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {latestRecord.sleepHours ?? 0}h / {latestRecord.sleepQuality ?? 0}
                    </p>
                  </div>
                  <div className="glass-surface p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Humor
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {latestRecord.moodLevel}/10
                    </p>
                  </div>
                  <div className="glass-surface p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Fadiga
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {latestRecord.fatigueLevel}/10
                    </p>
                  </div>
                  <div className="glass-surface p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Estresse
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {latestRecord.stressLevel}/10
                    </p>
                  </div>
                </div>
                <div className="rounded-[1.3rem] border border-white/80 bg-white/82 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Resumo real da ultima dor
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {latestRecord.notes?.trim() ||
                      "Sem resumo livre neste registro. O sistema usara areas, gatilhos e escalas preenchidas para contextualizar a ocorrencia."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {latestRecord.painAreas.map((area) => (
                      <Badge key={area} variant="neutral">
                        {area}
                      </Badge>
                    ))}
                    {latestRecord.painTriggers.map((trigger) => (
                      <Badge key={trigger} variant="default">
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ainda nao ha um registro recente dentro do periodo selecionado.
              </p>
            )}
          </div>

          <div className="panel-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Motor clinico x IA
                </p>
                <p className="text-sm text-muted-foreground">
                  Fontes separadas para evitar confusao entre regra e inferencia.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.4rem] border border-white/80 bg-white/82 p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Rule Engine
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Calculado a partir dos seus inputs clinicos reais.
                    </p>
                  </div>
                  <Badge
                    variant={
                      latestRulePrediction?.riskLevel === "HIGH" ||
                      latestRulePrediction?.riskLevel === "CRITICAL"
                        ? "warning"
                        : "default"
                    }
                  >
                    {latestRulePrediction
                      ? `${latestRulePrediction.probabilityScore}%`
                      : "Sem calculo"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {latestRulePrediction?.explanation ??
                    "Ainda nao existe um calculo recente do motor clinico para mostrar aqui."}
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-white/80 bg-white/82 p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      AI Prediction
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Insight armazenado da camada de IA, quando disponivel.
                    </p>
                  </div>
                  <Badge
                    variant={
                      latestAiPrediction?.riskLevel === "HIGH"
                        ? "warning"
                        : "default"
                    }
                  >
                    {isLoadingLatestAi ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : latestAiPrediction ? (
                      `${latestAiPrediction.probabilityScore}%`
                    ) : (
                      "Sem IA"
                    )}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {latestAiPrediction?.explanation ??
                    "Nenhuma previsao de IA foi armazenada ainda para este paciente."}
                </p>
                {latestAiPrediction?.suggestedAction ? (
                  <div className="mt-3 rounded-[1.2rem] bg-violet-50/80 px-4 py-3 text-sm text-violet-900">
                    {latestAiPrediction.suggestedAction}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Cobertura do periodo
              </p>
              <p className="text-sm text-muted-foreground">
                Dias com registro valido dentro da janela escolhida.
              </p>
            </div>
          </div>
          <Progress value={Math.min((aggregates.length / rangeDays) * 100, 100)} />
          <p className="mt-3 text-sm text-muted-foreground">
            {aggregates.length} dias com dados entre {windowRange.dateFrom} e{" "}
            {windowRange.dateTo}.
          </p>
        </div>

        <div className="panel-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Carga de sintomas recente
              </p>
              <p className="text-sm text-muted-foreground">
                Media diaria baseada em sinais independentes registrados.
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-semibold text-foreground">
                {formatNumber(
                  latestDay?.symptomLoadAverage ?? 0,
                )}
                /10
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {latestDay
                  ? `Ultimo dia observado: ${formatLongDate(latestDay.date)}`
                  : "Sem sinais recentes"}
              </p>
            </div>
            <Badge variant="neutral">{rangeDays} dias</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
