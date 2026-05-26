import { useMemo } from 'react'
import {
  Activity,
  HeartPulse,
  MoonStar,
  SmilePlus,
  Sparkles,
  LoaderCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { TrendLineChart } from '@/components/charts/trend-line-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { usePageTitle } from '@/hooks/use-page-title'
import { useDailyRecords } from '@/hooks/useDailyRecords'
import { usePrediction } from '@/hooks/usePrediction'
import { useUser } from '@/hooks/useUser'
import { useSymptoms } from '@/hooks/useSymptoms'

export function DashboardPage() {
  usePageTitle('Dashboard')

  const { user } = useUser()
  const { records, isLoading: isLoadingRecords } = useDailyRecords()
  const { latestPrediction, isLoadingLatest } = usePrediction()
  const { symptoms, isLoading: isLoadingSymptoms } = useSymptoms()

  const isLoading = isLoadingRecords || isLoadingLatest || isLoadingSymptoms

  // Compute stats from records
  const latestRecord = records?.length ? records[records.length - 1] : null
  const painLevel = latestRecord?.painLevel || 0
  const sleepQuality = latestRecord?.sleepQuality || 0
  const mood = latestRecord?.mood || 'Sem dados'
  const streak = records?.length || 0

  // Format chart data
  const dashboardTrend = useMemo(() => {
    if (!records) return []
    return records.slice(-7).map((r) => ({
      label: new Date(r.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      value: r.painLevel,
      comparison: r.fatigueLevel,
    }))
  }, [records])

  const sleepTrend = useMemo(() => {
    if (!records) return []
    return records.slice(-7).map((r) => ({
      label: new Date(r.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      value: r.sleepQuality,
    }))
  }, [records])

  const topSymptoms = useMemo(() => {
    if (!symptoms) return []
    return symptoms.slice(0, 4).map((s) => ({
      label: s.name,
      value: s.intensity * 10, // Assuming 0-10 mapped to percentage 0-100
    }))
  }, [symptoms])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={`Olá, ${user?.name?.split(' ')[0] || 'Paciente'}`}
        title="Como você está se sentindo hoje?"
        description="Acompanhe dor, sono, humor e sinais sutis do seu corpo com uma visão clara e delicada."
        actions={
          <Button asChild>
            <Link to="/patient/pain-log">Novo registro</Link>
          </Button>
        }
      />

      <div className="metric-grid grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Nível de dor"
          value={painLevel.toString()}
          hint={painLevel > 5 ? 'Alta' : 'Controlada'}
          icon={HeartPulse}
        />
        <StatCard label="Humor" value={mood} hint="Hoje" icon={SmilePlus} />
        <StatCard label="Sono" value={`${sleepQuality}/10`} hint="Qualidade" icon={MoonStar} />
        <StatCard label="Registros" value={`${streak} dias`} hint="Total de avaliações" icon={Activity} />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-brand-500">Nível de dor</p>
              <h2 className="mt-2 text-xl font-semibold md:text-2xl">Evolução da semana</h2>
            </div>
            <Button variant="secondary" size="sm">
              Ver histórico
            </Button>
          </div>
          {dashboardTrend.length > 0 ? (
            <TrendLineChart data={dashboardTrend} secondaryKey="comparison" height={250} />
          ) : (
            <div className="flex h-[250px] items-center justify-center text-slate-400">
              Sem dados suficientes
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-500">Insights da IA</p>
                <h2 className="mt-1 text-lg font-semibold md:text-xl">Padrões encontrados</h2>
              </div>
            </div>
            <div className="space-y-3">
              {latestPrediction ? (
                <>
                  <div className="rounded-[1.2rem] border border-white/80 bg-brand-50/55 p-4">
                    <p className="text-sm font-semibold text-foreground">Análise</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {latestPrediction.explanation}
                    </p>
                  </div>
                  {latestPrediction.suggestedActions?.map((action: string, i: number) => (
                    <div
                      key={i}
                      className="rounded-[1.2rem] border border-white/80 bg-brand-50/55 p-4"
                    >
                      <p className="text-sm font-semibold text-foreground">Ação Recomendada {i+1}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {action}
                      </p>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-sm text-slate-500">Nenhum insight gerado recentemente.</div>
              )}
            </div>
          </div>

          <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
            <p className="text-sm font-medium text-brand-500">Resumo de hoje</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#48C6A3' }} />
                  <p className="text-sm text-foreground">Dor</p>
                </div>
                <Badge>{painLevel}/10</Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#B668FF' }} />
                  <p className="text-sm text-foreground">Sono</p>
                </div>
                <Badge>{sleepQuality}/10</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-brand-500">Sono</p>
              <h2 className="mt-2 text-xl font-semibold md:text-2xl">Qualidade do descanso</h2>
            </div>
          </div>
          {sleepTrend.length > 0 ? (
            <TrendLineChart data={sleepTrend} color="#5C87FF" height={220} />
          ) : (
            <div className="flex h-[220px] items-center justify-center text-slate-400">
              Sem dados suficientes
            </div>
          )}
        </div>

        <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
          <div className="mb-5">
            <p className="text-sm font-medium text-brand-500">Principais sintomas</p>
            <h2 className="mt-2 text-xl font-semibold md:text-2xl">Peso dos sintomas registrados</h2>
          </div>
          <div className="space-y-4">
            {topSymptoms.length > 0 ? topSymptoms.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.value}%</p>
                </div>
                <Progress value={item.value} className="h-2.5" />
              </div>
            )) : (
              <div className="text-sm text-slate-500">Nenhum sintoma registrado recentemente.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
