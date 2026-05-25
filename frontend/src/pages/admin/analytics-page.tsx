import { useState } from 'react'
import { TriggersBarChart } from '@/components/admin/charts/triggers-chart'
import { SymptomsPatternsChart } from '@/components/admin/charts/symptoms-chart'
import { SymptomCorrelationChart } from '@/components/admin/charts/symptom-correlation-chart'
import { PredictionHistoryChart } from '@/components/admin/charts/prediction-history-chart'
import { DateRangeFilter } from '@/components/admin/cards/date-range-filter'
import { AdminContentSection } from '@/components/admin/cards/content-section'
import { PageHeader } from '@/components/page-header'
import { usePageTitle } from '@/hooks/use-page-title'
import { useAnalytics } from '@/hooks/use-admin'

export function AdminAnalyticsPage() {
  usePageTitle('Análiticos')

  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data: analyticsData, isLoading } = useAnalytics(startDate, endDate)

  // Mock data
  const mockTriggersData = [
    { name: 'Estresse', count: 125 },
    { name: 'Atividade Física', count: 98 },
    { name: 'Sono Ruim', count: 87 },
    { name: 'Clima', count: 76 },
    { name: 'Alimentação', count: 65 },
    { name: 'Hormonal', count: 54 },
  ]

  const mockSymptomsData = [
    { symptom: 'Dor muscular', frequency: 85, avgIntensity: 6.5 },
    { symptom: 'Fadiga', frequency: 72, avgIntensity: 7.2 },
    { symptom: 'Insônia', frequency: 68, avgIntensity: 6.8 },
    { symptom: 'Cefaleia', frequency: 55, avgIntensity: 5.9 },
    { symptom: 'Dormência', frequency: 42, avgIntensity: 5.1 },
  ]

  const mockCorrelationData = [
    { symptom1: 'Estresse', symptom2: 'Insônia', correlation: 0.87, frequency: 45 },
    { symptom1: 'Insônia', symptom2: 'Fadiga', correlation: 0.92, frequency: 62 },
    { symptom1: 'Atividade Física', symptom2: 'Dor Muscular', correlation: 0.79, frequency: 38 },
    { symptom1: 'Estresse', symptom2: 'Cefaleia', correlation: 0.65, frequency: 28 },
    { symptom1: 'Sono Ruim', symptom2: 'Fadiga', correlation: 0.88, frequency: 55 },
  ]

  const mockPredictionData = [
    { date: '2026-04-01', accuracy: 78.5, predictions: 12 },
    { date: '2026-04-08', accuracy: 82.3, predictions: 15 },
    { date: '2026-04-15', accuracy: 79.8, predictions: 18 },
    { date: '2026-04-22', accuracy: 85.1, predictions: 20 },
    { date: '2026-04-29', accuracy: 87.2, predictions: 22 },
    { date: '2026-05-06', accuracy: 89.4, predictions: 25 },
    { date: '2026-05-13', accuracy: 88.9, predictions: 24 },
    { date: '2026-05-20', accuracy: 90.2, predictions: 28 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inteligência"
        title="Análiticos avançados"
        description="Análise profunda de padrões, correlações e predições"
      />

      {/* Filtro de período */}
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* Grid de gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gatilhos */}
        <AdminContentSection
          title="Gatilhos Mais Comuns"
          description="Causas mais frequentes de crises no período"
          isLoading={isLoading}
        >
          <TriggersBarChart data={mockTriggersData} />
        </AdminContentSection>

        {/* Sintomas */}
        <AdminContentSection
          title="Padrões de Sintomas"
          description="Frequência e intensidade média dos sintomas"
          isLoading={isLoading}
        >
          <SymptomsPatternsChart data={mockSymptomsData} />
        </AdminContentSection>
      </div>

      {/* Correlação de sintomas */}
      <AdminContentSection
        title="Correlação de Sintomas"
        description="Sintomas que frequentemente aparecem juntos"
        isLoading={isLoading}
      >
        <SymptomCorrelationChart data={mockCorrelationData} />
      </AdminContentSection>

      {/* Histórico de Predições */}
      <AdminContentSection
        title="Histórico de Predições"
        description="Evolução da acurácia e volume de predições"
        isLoading={isLoading}
      >
        <PredictionHistoryChart data={mockPredictionData} />
      </AdminContentSection>

      {/* Estatísticas adicionais */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-sm text-muted-foreground mb-1">Total de Registros</p>
          <p className="text-3xl font-bold text-foreground">
            {analyticsData?.dailyRecords.length ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">no período</p>
        </div>

        <div className="card-surface p-4">
          <p className="text-sm text-muted-foreground mb-1">Padrões Identificados</p>
          <p className="text-3xl font-bold text-foreground">
            {mockCorrelationData.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">correlações fortes</p>
        </div>

        <div className="card-surface p-4">
          <p className="text-sm text-muted-foreground mb-1">Acurácia Média</p>
          <p className="text-3xl font-bold text-foreground">
            {(mockPredictionData.reduce((a, b) => a + b.accuracy, 0) / mockPredictionData.length).toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">das predições</p>
        </div>
      </div>
    </div>
  )
}
