import {
  Activity,
  HeartPulse,
  MoonStar,
  SmilePlus,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { TrendLineChart } from '@/components/charts/trend-line-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { usePageTitle } from '@/hooks/use-page-title'
import {
  aiInsights,
  dailySummary,
  dashboardTrend,
  sleepTrend,
  symptomBreakdown,
} from '@/services/mock-data'

export function DashboardPage() {
  usePageTitle('Dashboard')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Olá, Juliana"
        title="Como você está se sentindo hoje?"
        description="Acompanhe dor, sono, humor e sinais sutis do seu corpo com uma visão clara e delicada."
        actions={
          <Button asChild>
            <Link to="/app/pain-log">Novo registro</Link>
          </Button>
        }
      />

      <div className="metric-grid">
        <StatCard
          label="Nível de dor"
          value="6"
          hint="Moderada"
          trend="+10% nesta semana"
          icon={HeartPulse}
        />
        <StatCard label="Humor" value="Bom" hint="Equilíbrio emocional" icon={SmilePlus} />
        <StatCard label="Sono" value="7h 20m" hint="Bom descanso" icon={MoonStar} />
        <StatCard label="Sequência" value="12 dias" hint="Registros consistentes" icon={Activity} />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.35fr_0.65fr]">
        <div className="card-surface p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="section-label">Nível de dor</p>
              <h2 className="mt-2 text-2xl font-semibold">Evolução da semana</h2>
            </div>
            <Button variant="secondary" size="sm">
              Ver histórico
            </Button>
          </div>
          <TrendLineChart data={dashboardTrend} secondaryKey="comparison" height={280} />
        </div>

        <div className="space-y-6">
          <div className="card-surface p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="section-label">Insights da IA</p>
                <h2 className="mt-1 text-xl font-semibold">Padrões encontrados</h2>
              </div>
            </div>
            <div className="space-y-4">
              {aiInsights.map((insight) => (
                <div
                  key={insight.title}
                  className="rounded-[1.35rem] border border-white/80 bg-brand-50/55 p-4"
                >
                  <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface p-6">
            <p className="section-label">Resumo de hoje</p>
            <div className="mt-5 space-y-4">
              {dailySummary.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background:
                          item.tone === 'warning'
                            ? '#FFB547'
                            : item.tone === 'success'
                              ? '#48C6A3'
                              : '#B668FF',
                      }}
                    />
                    <p className="text-sm text-foreground">{item.label}</p>
                  </div>
                  <Badge variant={item.tone === 'warning' ? 'warning' : item.tone === 'success' ? 'success' : 'default'}>
                    {item.value}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="card-surface p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="section-label">Sono</p>
              <h2 className="mt-2 text-2xl font-semibold">Qualidade do descanso</h2>
            </div>
            <Badge variant="success">Melhora de 14%</Badge>
          </div>
          <TrendLineChart data={sleepTrend} color="#5C87FF" height={240} />
        </div>

        <div className="card-surface p-6">
          <div className="mb-6">
            <p className="section-label">Principais sintomas</p>
            <h2 className="mt-2 text-2xl font-semibold">Peso dos sintomas na semana</h2>
          </div>
          <div className="space-y-5">
            {symptomBreakdown.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.value}%</p>
                </div>
                <Progress
                  value={item.value}
                  className="h-2.5"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
