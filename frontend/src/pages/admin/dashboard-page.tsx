import { Users, AlertCircle, Zap, TrendingUp, Calendar, Activity } from 'lucide-react'
import { useState } from 'react'
import { AdminMetricCard } from '@/components/admin/cards/metric-card'
import { CrisisAlertsTable } from '@/components/admin/tables/crisis-alerts-table'
import { TriggersBarChart } from '@/components/admin/charts/triggers-chart'
import { DateRangeFilter } from '@/components/admin/cards/date-range-filter'
import { AdminContentSection } from '@/components/admin/cards/content-section'
import { PageHeader } from '@/components/page-header'
import { usePageTitle } from '@/hooks/use-page-title'
import { useAdminDashboardMetrics, useCrisisAlerts } from '@/hooks/use-admin'

export function AdminDashboardPage() {
  usePageTitle('Dashboard Admin')

  const { metrics, isLoading: metricsLoading } = useAdminDashboardMetrics()
  const { data: alertsData, isLoading: alertsLoading } = useCrisisAlerts(1, 10)

  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  // Mock data for triggers - replace with real data from API
  const triggersData = [
    { name: 'Estresse', count: 45 },
    { name: 'Atividade Física', count: 38 },
    { name: 'Sono Ruim', count: 32 },
    { name: 'Clima', count: 28 },
    { name: 'Alimentação', count: 25 },
  ]

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="FibroSync Admin"
          title="Dashboard administrativo"
          description="Monitore métricas e alertas do sistema em tempo real"
        />
        <div className="text-center py-12 text-muted-foreground">Carregando dados...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="FibroSync Admin"
        title="Dashboard administrativo"
        description="Monitore métricas e alertas do sistema em tempo real"
      />

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label="Total de Usuários"
          value={metrics?.totalUsers ?? 0}
          icon={Users}
          variant="default"
          trend={12}
        />
        <AdminMetricCard
          label="Usuários Ativos"
          value={metrics?.activeUsers ?? 0}
          icon={Activity}
          variant="success"
          trend={8}
        />
        <AdminMetricCard
          label="Risco Médio de Crise"
          value={`${(metrics?.averageCrisisRisk ?? 0).toFixed(1)}%`}
          icon={AlertCircle}
          variant="warning"
          trend={-5}
        />
        <AdminMetricCard
          label="Taxa de Adesão"
          value={`${(metrics?.adherenceRate ?? 0).toFixed(1)}%`}
          icon={TrendingUp}
          variant="success"
          trend={3}
        />
      </div>

      {/* Filtro de período */}
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApply={() => {
          // Trigger analytics refresh
          console.log('Applying date range:', startDate, endDate)
        }}
      />

      {/* Gráfico de gatilhos */}
      <AdminContentSection
        title="Gatilhos Mais Comuns"
        description={`Principais causadores de crises no período de ${startDate} a ${endDate}`}
      >
        <TriggersBarChart data={triggersData} />
      </AdminContentSection>

      {/* Alertas recentes */}
      <AdminContentSection
        title="Alertas de Crise Recentes"
        description="Últimas detecções de risco alto ou crítico"
        isLoading={alertsLoading}
      >
        {alertsData && alertsData.data.length > 0 ? (
          <CrisisAlertsTable alerts={alertsData.data} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum alerta de crise nos últimos 7 dias. Sistema operando normalmente.
          </div>
        )}
      </AdminContentSection>

      {/* Informações adicionais */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-yellow-600 mt-1" />
            <div>
              <p className="text-sm font-semibold text-foreground">Gatilho Mais Frequente</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {metrics?.mostCommonTrigger ?? 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="card-surface p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm font-semibold text-foreground">Registros Diários</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {metrics?.dailyRecordsCount ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card-surface p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
            <div>
              <p className="text-sm font-semibold text-foreground">Histórico de Predições</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {metrics?.predictionHistoryCount ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
