import { useMemo } from "react";
import {
  Activity,
  CloudSun,
  Clock3,
  Droplets,
  HeartPulse,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Sparkles,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePageTitle } from "@/hooks/use-page-title";
import { useDailyRecords } from "@/hooks/useDailyRecords";
import { usePrediction } from "@/hooks/usePrediction";
import { useUser } from "@/hooks/useUser";
import type { DailyRecord } from "@/services/daily-record.service";
import { useCurrentLocation, useWeather } from "@/hooks/useWeather";

type FrequencyItem = {
  label: string;
  count: number;
  percentage: number;
};

function buildFrequency(values: string[]): FrequencyItem[] {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });

  const maxCount = Math.max(...counts.values(), 1);

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / maxCount) * 100),
    }))
    .sort(
      (left, right) =>
        right.count - left.count || left.label.localeCompare(right.label),
    );
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Number(
    (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1),
  );
}

function formatEntryDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatEntryTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isSameCalendarDay(value: string, reference: Date): boolean {
  const date = new Date(value);

  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function resolvePainState(painLevel: number): string {
  if (painLevel >= 8) {
    return "Muito alta";
  }

  if (painLevel >= 6) {
    return "Alta";
  }

  if (painLevel >= 3) {
    return "Moderada";
  }

  return "Controlada";
}

function resolvePainBadgeVariant(
  painLevel: number,
): "default" | "success" | "warning" | "neutral" {
  if (painLevel >= 6) {
    return "warning";
  }

  if (painLevel === 0) {
    return "neutral";
  }

  return "success";
}

function summarizeAreas(record: DailyRecord): string {
  if (record.painAreas.length === 0) {
    return "Areas nao informadas";
  }

  return record.painAreas.join(", ");
}

export function DashboardPage() {
  usePageTitle("Dashboard");

  const { user } = useUser();
  const { records, isLoading: isLoadingRecords } = useDailyRecords();
  const { latestPrediction, isLoadingLatest } = usePrediction();
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
    isFetching: isFetchingWeather,
    refetch: refetchWeather,
  } = useWeather(coordinates?.lat, coordinates?.lon);

  const isLoading = isLoadingRecords || isLoadingLatest;
  const recordList = Array.isArray(records) ? records : [];
  const latestRecord = recordList[0] ?? null;
  const trendWindow = recordList.slice(0, 7);
  const patternWindow = recordList.slice(0, 12);

  const currentPainLevel = latestRecord?.painLevel ?? 0;
  const currentMood = latestRecord?.mood ?? null;
  const currentSleepQuality = latestRecord?.sleepQuality ?? null;

  const recordsToday = useMemo(
    () =>
      recordList.filter((record) =>
        isSameCalendarDay(record.createdAt, new Date()),
      ).length,
    [recordList],
  );

  const recentPainAverage = useMemo(
    () => calculateAverage(trendWindow.map((record) => record.painLevel)),
    [trendWindow],
  );

  const peakPainRecord = useMemo(
    () =>
      trendWindow.reduce<DailyRecord | null>((highest, record) => {
        if (!highest || record.painLevel > highest.painLevel) {
          return record;
        }

        return highest;
      }, null),
    [trendWindow],
  );

  const dashboardTrend = useMemo(
    () =>
      trendWindow
        .slice()
        .reverse()
        .map((record) => ({
          label: formatEntryDateTime(record.createdAt),
          value: record.painLevel,
          comparison: record.stressLevel,
        })),
    [trendWindow],
  );

  const recentEntries = useMemo(() => recordList.slice(0, 4), [recordList]);

  const topPainAreas = useMemo(
    () =>
      buildFrequency(patternWindow.flatMap((record) => record.painAreas)).slice(
        0,
        4,
      ),
    [patternWindow],
  );

  const topPainTriggers = useMemo(
    () =>
      buildFrequency(
        patternWindow.flatMap((record) => record.painTriggers),
      ).slice(0, 4),
    [patternWindow],
  );

  const topPainTypes = useMemo(
    () =>
      buildFrequency(
        patternWindow
          .map((record) => record.painType)
          .filter((value): value is string => Boolean(value)),
      ).slice(0, 3),
    [patternWindow],
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={`Olá, ${user?.fullName?.split(" ")[0] || "Paciente"}`}
        title="Como a sua dor tem se comportado?"
        description="Acompanhe intensidade, horarios, areas afetadas e gatilhos reais registrados ao longo do dia."
        actions={
          <Button asChild>
            <Link to="/app/pain-log">Novo registro</Link>
          </Button>
        }
      />

      <div className="metric-grid grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Dor atual"
          value={`${currentPainLevel}/10`}
          hint={resolvePainState(currentPainLevel)}
          icon={HeartPulse}
        />
        <StatCard
          label="Media recente"
          value={`${recentPainAverage.toFixed(1)}/10`}
          hint="Ultimos 7 registros"
          icon={TrendingUp}
        />
        <StatCard
          label="Registros hoje"
          value={recordsToday.toString()}
          hint="Ocorrencias salvas hoje"
          icon={Clock3}
        />
        <StatCard
          label="Pico recente"
          value={`${peakPainRecord?.painLevel ?? 0}/10`}
          hint={
            peakPainRecord
              ? formatEntryTime(peakPainRecord.createdAt)
              : "Sem historico"
          }
          icon={Activity}
        />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
        <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-brand-500">
                Dor e estresse
              </p>
              <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                Evolucao das ultimas ocorrencias
              </h2>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link to="/app/reports">Ver relatorios</Link>
            </Button>
          </div>
          {dashboardTrend.length > 0 ? (
            <TrendLineChart
              data={dashboardTrend}
              secondaryKey="comparison"
              height={250}
            />
          ) : (
            <div className="flex h-[250px] items-center justify-center text-slate-400">
              Registre a dor para visualizar a evolucao real.
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <CloudSun className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-500">
                  Clima em tempo real
                </p>
                <h2 className="mt-1 text-lg font-semibold md:text-xl">
                  Como o tempo pode afetar hoje
                </h2>
              </div>
            </div>

            {locationStatus === "loading" ||
            (locationStatus === "ready" && isLoadingWeather) ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-16 rounded-[1.2rem] bg-slate-100" />
                <div className="h-3 w-3/4 rounded-full bg-slate-100" />
                <div className="h-3 w-1/2 rounded-full bg-slate-100" />
              </div>
            ) : null}

            {locationStatus === "ready" && weather ? (
              <div className="space-y-4">
                <div className="rounded-[1.2rem] border border-white/80 bg-brand-50/55 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-3xl font-semibold tracking-[-0.06em] text-foreground">
                        {Math.round(weather.temperature)}°C
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {conditionLabel}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Badge
                        variant={isWeatherRiskElevated ? "warning" : "success"}
                      >
                        {isWeatherRiskElevated
                          ? "Atenção climática"
                          : "Clima estável"}
                      </Badge>
                      {sourceLabel ? (
                        <Badge variant="neutral">{sourceLabel}</Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/75 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Umidade
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {Math.round(weather.humidity)}%
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/75 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Sensação
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {Math.round(weather.apparentTemperature)}°C
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.2rem] border border-dashed border-brand-100 bg-white/80 p-4">
                  <div className="flex items-start gap-3">
                    <Droplets className="mt-0.5 h-4 w-4 text-brand-500" />
                    <p className="text-sm leading-6 text-muted-foreground">
                      {impactMessage}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void refetchWeather()}
                  >
                    Atualizar clima
                  </Button>
                  {isFetchingWeather ? (
                    <Badge variant="neutral">Sincronizando...</Badge>
                  ) : (
                    <Badge variant="neutral">GPS conectado</Badge>
                  )}
                </div>
              </div>
            ) : null}

            {(locationStatus === "denied" ||
              locationStatus === "unsupported" ||
              locationStatus === "error") &&
            !weather ? (
              <div className="rounded-[1.2rem] border border-dashed border-brand-100 bg-white/80 p-4">
                <div className="flex items-start gap-3">
                  <LocateFixed className="mt-0.5 h-4 w-4 text-brand-500" />
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {locationError ??
                        "Sem localização no momento. Você ainda pode usar o app normalmente."}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={requestLocation}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-500">
                  Ultimo registro
                </p>
                <h2 className="mt-1 text-lg font-semibold md:text-xl">
                  Resumo real da ultima dor
                </h2>
              </div>
            </div>

            {latestRecord ? (
              <div className="space-y-4">
                <div className="rounded-[1.2rem] border border-white/80 bg-brand-50/55 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {latestRecord.painType || "Tipo de dor nao informado"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatEntryDateTime(latestRecord.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={resolvePainBadgeVariant(latestRecord.painLevel)}
                    >
                      {latestRecord.painLevel}/10
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {latestRecord.notes?.trim() ||
                      "Sem observacoes adicionadas neste registro."}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Areas relatadas
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {latestRecord.painAreas.length > 0 ? (
                      latestRecord.painAreas.map((area) => (
                        <Badge key={area}>{area}</Badge>
                      ))
                    ) : (
                      <Badge variant="neutral">Nenhuma area informada</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Gatilhos percebidos
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {latestRecord.painTriggers.length > 0 ? (
                      latestRecord.painTriggers.map((trigger) => (
                        <Badge key={trigger} variant="warning">
                          {trigger}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="neutral">Nenhum gatilho informado</Badge>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Ainda nao ha registro de dor salvo para exibir neste painel.
              </div>
            )}
          </div>

          <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-500">
                  Leitura do dia
                </p>
                <h2 className="mt-1 text-lg font-semibold md:text-xl">
                  Contexto atual
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-foreground">Dor</p>
                <Badge variant={resolvePainBadgeVariant(currentPainLevel)}>
                  {currentPainLevel}/10
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-foreground">Humor</p>
                <Badge variant="neutral">
                  {currentMood !== null ? `${currentMood}/10` : "Sem dado"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-foreground">Qualidade do sono</p>
                <Badge variant="neutral">
                  {currentSleepQuality !== null
                    ? `${currentSleepQuality}/10`
                    : "Sem dado"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-foreground">
                  Ocorrencias salvas hoje
                </p>
                <Badge>{recordsToday}</Badge>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Insight rapido
              </p>
              {weather && isWeatherRiskElevated ? (
                <div className="rounded-[1.2rem] border border-amber-100 bg-amber-50/80 p-4">
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Clima atual pode contribuir para maior risco de
                        sintomas.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {impactMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
              {latestPrediction ? (
                <div className="rounded-[1.2rem] border border-white/80 bg-brand-50/55 p-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {latestPrediction.explanation}
                  </p>
                </div>
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-brand-100 bg-white/80 p-4 text-sm text-slate-500">
                  O painel de IA ainda nao encontrou um padrao recente para
                  complementar os seus registros.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-brand-500">
                Linha do tempo
              </p>
              <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                Ultimas dores registradas
              </h2>
            </div>
          </div>
          <div className="space-y-3">
            {recentEntries.length > 0 ? (
              recentEntries.map((record) => (
                <div
                  key={record.id}
                  className="rounded-[1.2rem] border border-white/80 bg-white/88 px-4 py-3.5 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {record.painType || "Dor registrada"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatEntryDateTime(record.createdAt)}
                      </p>
                    </div>
                    <Badge variant={resolvePainBadgeVariant(record.painLevel)}>
                      {record.painLevel}/10
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {summarizeAreas(record)}
                  </p>
                  {record.painTriggers.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {record.painTriggers.slice(0, 3).map((trigger) => (
                        <Badge
                          key={`${record.id}-${trigger}`}
                          variant="warning"
                        >
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">
                Nenhuma ocorrencia de dor foi registrada ainda.
              </div>
            )}
          </div>
        </div>

        <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-brand-500">
                Padroes recentes
              </p>
              <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                Areas e gatilhos mais citados
              </h2>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Areas mais afetadas
              </p>
              {topPainAreas.length > 0 ? (
                topPainAreas.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.count}x
                      </p>
                    </div>
                    <Progress value={item.percentage} className="h-2.5" />
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">
                  As areas do corpo vao aparecer aqui conforme os registros
                  forem feitos.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Gatilhos mais percebidos
              </p>
              <div className="flex flex-wrap gap-2">
                {topPainTriggers.length > 0 ? (
                  topPainTriggers.map((item) => (
                    <Badge key={item.label} variant="warning">
                      {item.label} • {item.count}x
                    </Badge>
                  ))
                ) : (
                  <Badge variant="neutral">Sem gatilhos frequentes ainda</Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Tipos de dor recorrentes
              </p>
              <div className="flex flex-wrap gap-2">
                {topPainTypes.length > 0 ? (
                  topPainTypes.map((item) => (
                    <Badge key={item.label}>
                      {item.label} • {item.count}x
                    </Badge>
                  ))
                ) : (
                  <Badge variant="neutral">Sem tipos recorrentes ainda</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
