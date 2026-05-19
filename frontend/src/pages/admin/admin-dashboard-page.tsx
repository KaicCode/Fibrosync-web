import { BarChart3, DollarSign, LineChart, Users } from 'lucide-react'
import { RingChart } from '@/components/charts/ring-chart'
import { RevenueBarChart } from '@/components/charts/revenue-bar-chart'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { usePageTitle } from '@/hooks/use-page-title'
import {
  adminActivity,
  adminMetrics,
  adminRevenue,
  retentionSegments,
} from '@/services/mock-data'

const metricIcons = [Users, Users, DollarSign, LineChart]

export function AdminDashboardPage() {
  usePageTitle('Administração')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="SaaS overview"
        title="Dashboard administrativo web com leitura de negócio premium"
        description="Monitore crescimento, retenção e atividade recente com a mesma linguagem visual limpa de toda a plataforma."
      />

      <div className="metric-grid">
        {adminMetrics.map((metric, index) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            trend={metric.trend}
            icon={metricIcons[index] ?? BarChart3}
            tone="success"
          />
        ))}
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
        <div className="card-surface p-5">
          <p className="section-label">Receita</p>
          <h2 className="mt-2 text-xl font-semibold md:text-2xl">Crescimento mensal</h2>
          <div className="mt-5">
            <RevenueBarChart data={adminRevenue} />
          </div>
        </div>

        <div className="card-surface p-5">
          <p className="section-label">Retenção</p>
          <h2 className="mt-2 text-xl font-semibold md:text-2xl">Base ativa vs em risco</h2>
          <div className="mt-5">
            <RingChart data={retentionSegments.map((segment) => ({ ...segment, fill: segment.color }))} />
          </div>
          <div className="mt-2 space-y-3">
            {retentionSegments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="text-foreground">{segment.label}</span>
                </div>
                <span className="text-muted-foreground">{segment.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-surface p-5">
        <p className="section-label">Atividade recente</p>
        <h2 className="mt-2 text-xl font-semibold md:text-2xl">Movimentos importantes do produto</h2>
        <div className="mt-5 space-y-3">
          {adminActivity.map((item) => (
            <div
              key={`${item.title}-${item.time}`}
              className="flex items-center justify-between rounded-[1.2rem] border border-white/80 bg-white/84 px-4 py-3.5 shadow-soft"
            >
              <div className="flex items-center gap-4">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <p className="text-sm font-medium text-foreground">{item.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{item.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
