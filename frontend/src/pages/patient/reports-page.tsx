import { Download } from 'lucide-react'
import { RingChart } from '@/components/charts/ring-chart'
import { TrendLineChart } from '@/components/charts/trend-line-chart'
import { PageHeader } from '@/components/page-header'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'
import {
  reportHighlights,
  reportTrend,
  symptomBreakdown,
} from '@/services/mock-data'

export function ReportsPage() {
  usePageTitle('Relatórios')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analytics premium"
        title="Relatórios visuais com clareza clínica"
        description="Compare ciclos, observe evolução e gere materiais prontos para compartilhar com seu acompanhamento."
        actions={
          <Button>
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        }
      />

      <Tabs defaultValue="semana">
        <TabsList>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mês</TabsTrigger>
          <TabsTrigger value="ano">Ano</TabsTrigger>
        </TabsList>
        <TabsContent value="semana" className="space-y-6">
          <div className="metric-grid">
            {reportHighlights.map((item) => (
              <div key={item.label} className="card-surface p-4 md:p-5">
                <p className="section-label">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-foreground">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
              </div>
            ))}
            <div className="card-surface p-4 md:p-5">
              <p className="section-label">Sono reparador</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-foreground">68%</p>
              <p className="mt-1 text-sm text-muted-foreground">Correlação com dor moderada</p>
            </div>
          </div>

          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
            <div className="card-surface p-5">
              <div className="mb-5">
                <p className="section-label">Comparativo</p>
                <h2 className="mt-2 text-xl font-semibold md:text-2xl">Nível de dor médio</h2>
              </div>
              <TrendLineChart data={reportTrend} secondaryKey="comparison" height={270} />
            </div>

            <div className="card-surface p-5">
              <div className="mb-5">
                <p className="section-label">Distribuição</p>
                <h2 className="mt-2 text-xl font-semibold md:text-2xl">Principais sintomas</h2>
              </div>
              <RingChart
                data={symptomBreakdown.map((item) => ({
                  label: item.label,
                  value: item.value,
                  color: item.color,
                  fill: item.color,
                }))}
              />
              <div className="mt-4 space-y-3">
                {symptomBreakdown.map((item) => (
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
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
