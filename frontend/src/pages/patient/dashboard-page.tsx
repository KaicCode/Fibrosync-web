import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Brain,
  CloudSun,
  HeartPulse,
  MoonStar,
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
  buildTimelineSeries,
  buildDailyAggregates,
  buildFrequency,
  formatLongDateLabel,
  resolveDateWindow,
  type DashboardRangeDays,
} from "@/features/clinical/record-analytics";
import { useDailyRoutine } from "@/hooks/useDailyRoutine";
import { useDailyRecords } from "@/hooks/useDailyRecords";
import { usePageTitle } from "@/hooks/use-page-title";
import { useUser } from "@/hooks/useUser";
import { useCurrentLocation, useWeather } from "@/hooks/useWeather";
import { toast } from "@/store/toast-store";

const rangeOptions: DashboardRangeDays[] = [7, 30, 90];

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

function formatTrackedDaysSummary(recordedDays: number, rangeDays: number): string {
  return `${recordedDays} de ${rangeDays} dias`;
}

function buildDashboardTrendSeries(
  aggregates: ReturnType<typeof buildDailyAggregates>,
  dateFrom: string,
  dateTo: string,
) {
  const daysByDate = new Map(aggregates.map((day) => [day.date, day]));
  return buildTimelineSeries(dateFrom, dateTo, (dateKey) => {
    const day = daysByDate.get(dateKey);

    return {
      value: day ? day.painAverage : null,
      comparison: day ? day.stressAverage : null,
    };
  });
}

function RoutineHighlightCard({
  title,
  message,
  description,
  icon: Icon,
  badge,
  actions,
}: {
  title: string;
  message: string;
  description: string;
  icon: typeof Sparkles;
  badge: string;
  actions: ReactNode;
}) {
  return (
    <div className="panel-surface p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <Badge variant="neutral" className="mt-1">
                {badge}
              </Badge>
            </div>
          </div>
          <p className="mt-4 text-base font-medium leading-7 text-foreground">
            {message}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 md:w-auto md:justify-end">
          {actions}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  usePageTitle("Dashboard");

  const { user } = useUser();
  const {
    dailySummary,
    dailyReminder,
    dismissDailySummary,
    snoozeDailyReminder,
  } = useDailyRoutine(user);
  const [rangeDays, setRangeDays] = useState<DashboardRangeDays>(30);
  const windowRange = useMemo(() => resolveDateWindow(rangeDays), [rangeDays]);
  const { records, isLoading: isLoadingRecords } = useDailyRecords({
    ...windowRange,
    includeAll: true,
  });
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
      buildDashboardTrendSeries(
        aggregates,
        windowRange.dateFrom,
        windowRange.dateTo,
      ),
    [aggregates, windowRange.dateFrom, windowRange.dateTo],
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

  const isLoading = isLoadingRecords;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow={`Ola, ${user?.fullName?.split(" ")[0] || "Paciente"}`}
          title="Como voce tem se sentido"
          description="Estamos preparando um resumo simples dos seus registros mais recentes."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
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
        title="Como voce tem se sentido"
        description="Aqui voce acompanha seus registros recentes e observa mudancas nos seus sintomas ao longo do tempo."
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

      {dailySummary || dailyReminder ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {dailySummary ? (
            <RoutineHighlightCard
              title={dailySummary.title}
              message={dailySummary.message}
              description={dailySummary.description}
              icon={Sparkles}
              badge="Resumo diario"
              actions={
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link to={dailySummary.actionTo}>{dailySummary.actionLabel}</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={dismissDailySummary}>
                    Fechar
                  </Button>
                </>
              }
            />
          ) : null}

          {dailyReminder ? (
            <RoutineHighlightCard
              title={dailyReminder.title}
              message={dailyReminder.message}
              description="Assim que voce registrar seu dia, este lembrete deixa de aparecer."
              icon={MoonStar}
              badge="Lembrete do fim do dia"
              actions={
                <>
                  <Button asChild size="sm">
                    <Link to={dailyReminder.actionTo}>{dailyReminder.actionLabel}</Link>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      snoozeDailyReminder();
                      toast.info(
                        "Vamos lembrar voce mais tarde",
                        "Este lembrete vai reaparecer em cerca de 1 hora.",
                      );
                    }}
                  >
                    {dailyReminder.secondaryLabel}
                  </Button>
                </>
              }
            />
          ) : null}
        </div>
      ) : null}

      <div className="metric-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Dor mais recente"
          value={`${latestRecord?.painLevel ?? 0}/10`}
          hint={latestRecord ? resolvePainState(latestRecord.painLevel) : "Sem registros no periodo"}
          icon={HeartPulse}
        />
        <StatCard
          label="Media da dor"
          value={`${formatNumber(averagePain)}/10`}
          hint={`Media dos seus registros nos ultimos ${rangeDays} dias`}
          icon={TrendingUp}
        />
        <StatCard
          label="Maior nivel de dor"
          value={`${peakDay?.painPeak ?? 0}/10`}
          hint={
            peakDay
              ? `Maior valor registrado nos ultimos ${rangeDays} dias`
              : "Voce ainda nao possui registros suficientes."
          }
          icon={Activity}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div className="space-y-5">
          <div className="panel-surface p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Evolucao diaria</p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Como a dor variou ao longo do tempo
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A linha principal mostra a media da dor em cada dia. A outra
                  linha mostra o estresse registrado no mesmo dia.
                </p>
              </div>
              <Badge variant="neutral">{`Ultimos ${rangeDays} dias`}</Badge>
            </div>

            <TrendLineChart
              data={trendSeries}
              secondaryKey="comparison"
              height={300}
              primaryLabel="Dor"
              secondaryLabel="Estresse"
              showLegend
              yDomain={[0, 10]}
              yTicks={[0, 2, 4, 6, 8, 10]}
              valueFormatter={(value) => `${formatNumber(value)}/10`}
              emptyState={{
                title: "Ainda nao ha registros neste periodo.",
                description:
                  "Comece a registrar como voce esta se sentindo para acompanhar sua evolucao ao longo do tempo.",
              }}
              singleRecordState={{
                title: "Voce possui apenas 1 registro neste periodo.",
                description:
                  "Continue registrando para acompanhar melhor a evolucao dos seus sintomas.",
              }}
            />
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
                    Com base no que voce registrou nesse periodo.
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
                    Ainda nao ha informacoes suficientes para mostrar as areas
                    mais citadas.
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
                    Com base no que voce registrou nesse periodo.
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
                    Nenhum gatilho apareceu nos seus registros mais recentes.
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
                  Clima de hoje
                </p>
                <p className="text-sm text-muted-foreground">
                  O clima pode influenciar como algumas pessoas se sentem ao
                  longo do dia.
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
                        {isWeatherRiskElevated ? "Mais atencao" : "Menor impacto"}
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
                        "Nao conseguimos carregar o clima agora. Voce pode continuar usando o dashboard normalmente mesmo sem essa informacao."}
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
                  Seu ultimo registro
                </p>
                <p className="text-sm text-muted-foreground">
                  Essas informacoes ajudam a acompanhar como voce estava se
                  sentindo no registro mais recente.
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
                    Como voce se sentiu nesse registro
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {latestRecord.notes?.trim() ||
                      "Voce nao adicionou uma observacao nesse registro. As informacoes marcadas abaixo continuam ajudando no seu acompanhamento."}
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
                Ainda nao ha um registro recente nos ultimos {rangeDays} dias.
              </p>
            )}
          </div>

          {/* Analise dos sintomas ocultada temporariamente a pedido do usuario. */}
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
                Dias acompanhados
              </p>
              <p className="text-sm text-muted-foreground">
                Dias em que voce registrou como estava se sentindo.
              </p>
            </div>
          </div>
          <Progress value={Math.min((aggregates.length / rangeDays) * 100, 100)} />
          <p className="mt-3 text-sm text-muted-foreground">
            {formatTrackedDaysSummary(aggregates.length, rangeDays)}
          </p>
        </div>

        <div className="panel-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Nivel recente dos sintomas
              </p>
              <p className="text-sm text-muted-foreground">
                Media dos sintomas no dia mais recente com registros.
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
                  ? `Ultimo dia acompanhado: ${formatLongDateLabel(latestDay.date)}`
                  : "Sem registros recentes"}
              </p>
            </div>
            <Badge variant="neutral">{rangeDays} dias</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
