import { Download, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { RingChart } from '@/components/charts/ring-chart'
import { TrendLineChart } from '@/components/charts/trend-line-chart'
import { PageHeader } from '@/components/page-header'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'
import { useReports } from '@/hooks/useReports'

const defaultColors = ['#B668FF', '#5C87FF', '#FFB547', '#48C6A3']

export function ReportsPage() {
  usePageTitle('Relatórios')
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly')

  const { summary, report, isLoadingSummary, isLoadingReport } = useReports(period)

  const isLoading = isLoadingSummary || isLoadingReport

  // Fallbacks if data doesn't perfectly match
  const highlights = summary?.highlights || [
    { label: 'Dor média', value: '4.2', hint: '-15% da média' },
    { label: 'Pico de dor', value: '7.0', hint: 'Quarta-feira' }
  ]

  const trendData = report?.charts?.trend || []
  const symptomsData = report?.charts?.symptoms || []

  const mappedSymptoms = symptomsData.map((s: any, i: number) => ({
    label: s.name || s.label,
    value: s.value || s.percentage,
    color: s.color || defaultColors[i % defaultColors.length],
    fill: s.color || defaultColors[i % defaultColors.length],
  }))

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analytics premium"
        title="Relatórios visuais com clareza clínica"
        description="Compare ciclos, observe evolução e gere materiais prontos para compartilhar com seu acompanhamento."
        actions={
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        }
      />

      <Tabs defaultValue="semana" onValueChange={(v) => {
        if (v === 'semana') setPeriod('weekly')
        if (v === 'mes') setPeriod('monthly')
        if (v === 'ano') setPeriod('quarterly')
      }}>
        <TabsList>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mês</TabsTrigger>
          <TabsTrigger value="ano">Ano</TabsTrigger>
        </TabsList>

        <TabsContent value={period === 'weekly' ? 'semana' : period === 'monthly' ? 'mes' : 'ano'} className="space-y-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-brand-500" />
            </div>
          ) : (
            <>
              <div className="metric-grid grid grid-cols-1 md:grid-cols-3 gap-4">
                {highlights.map((item: any, i: number) => (
                  <div key={i} className="card-surface p-4 md:p-5 rounded-[1.5rem] border border-white/80 bg-white/92 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                    <p className="text-sm font-medium text-brand-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-foreground">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
                <div className="card-surface p-5 rounded-[1.5rem] border border-white/80 bg-white/92 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5">
                    <p className="text-sm font-medium text-brand-500">Comparativo</p>
                    <h2 className="mt-2 text-xl font-semibold md:text-2xl">Nível de dor médio</h2>
                  </div>
                  {trendData.length > 0 ? (
                    <TrendLineChart data={trendData} secondaryKey="comparison" height={270} />
                  ) : (
                    <div className="flex h-[270px] items-center justify-center text-slate-400">
                      Sem dados do período para gráfico
                    </div>
                  )}
                </div>

                <div className="card-surface p-5 rounded-[1.5rem] border border-white/80 bg-white/92 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                  <div className="mb-5">
                    <p className="text-sm font-medium text-brand-500">Distribuição</p>
                    <h2 className="mt-2 text-xl font-semibold md:text-2xl">Principais sintomas</h2>
                  </div>
                  {mappedSymptoms.length > 0 ? (
                    <>
                      <RingChart data={mappedSymptoms} />
                      <div className="mt-4 space-y-3">
                        {mappedSymptoms.map((item: any) => (
                          <div key={item.label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-foreground">{item.label}</span>
                              </div>
                              <span className="text-muted-foreground">{item.value}%</span>
                            </div>
                            <Progress value={item.value} />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-[270px] items-center justify-center text-slate-400">
                      Sem dados de sintomas
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
