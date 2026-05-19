import { Activity, FileText, UsersRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { TrendLineChart } from '@/components/charts/trend-line-chart'
import { usePageTitle } from '@/hooks/use-page-title'
import {
  medicalPatients,
  medicalTrend,
  symptomBreakdown,
} from '@/services/mock-data'

export function MedicalDashboardPage() {
  usePageTitle('Painel Médico')

  const highlightedPatient = medicalPatients[0]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Visão clínica"
        title="Painel médico com evolução clara e objetiva"
        description="Acompanhe dor média, aderência e sinais mais recorrentes com uma leitura premium e acionável."
      />

      <div className="metric-grid">
        <StatCard label="Nível de dor médio" value={highlightedPatient.painLevel} hint="Moderado" icon={Activity} />
        <StatCard label="Registros" value={String(highlightedPatient.records)} hint="Entradas consolidadas" icon={FileText} />
        <StatCard label="Aderência" value={`${highlightedPatient.adherence}%`} hint="Excelente consistência" icon={UsersRound} />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card-surface p-6">
          <p className="section-label">Pacientes</p>
          <h2 className="mt-2 text-2xl font-semibold">Lista com atualização recente</h2>
          <div className="mt-6 space-y-4">
            {medicalPatients.map((patient) => (
              <div
                key={patient.name}
                className="flex items-center gap-4 rounded-[1.5rem] border border-white/80 bg-white/84 px-4 py-4 shadow-soft"
              >
                <Avatar>
                  <AvatarImage src={patient.avatar} alt={patient.name} />
                  <AvatarFallback>{patient.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">{patient.update}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-700">{patient.painLevel}</p>
                  <p className="text-xs text-muted-foreground">{patient.records} registros</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-6">
            <p className="section-label">Evolução da dor</p>
            <h2 className="mt-2 text-2xl font-semibold">Tendência clínica</h2>
            <div className="mt-6">
              <TrendLineChart data={medicalTrend} height={270} />
            </div>
          </div>

          <div className="card-surface p-6">
            <p className="section-label">Principais sintomas</p>
            <div className="mt-5 space-y-4">
              {symptomBreakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <p className="text-sm text-foreground">{item.label}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.value}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
