import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ClipboardList,
  FileClock,
  Stethoscope,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { TrendLineChart } from '@/components/charts/trend-line-chart'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePageTitle } from '@/hooks/use-page-title'
import { doctorService, type DoctorPeriodDays } from '@/services/doctor.service'
import {
  formatMedicalDate,
  formatMedicalDateTime,
  resolveFollowUpTone,
} from './medical-shared'

const periodOptions: DoctorPeriodDays[] = [7, 30, 90]

export function MedicalDashboardPage() {
  usePageTitle('Painel médico')

  const [periodDays, setPeriodDays] = useState<DoctorPeriodDays>(30)
  const dashboardQuery = useQuery({
    queryKey: ['doctorDashboard', periodDays],
    queryFn: () => doctorService.getDashboard(periodDays),
  })

  const dashboard = dashboardQuery.data

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Painel médico"
          title="Acompanhe seus pacientes e a evolução recente"
          description="Estamos organizando os dados clínicos vinculados ao seu acompanhamento."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
          <Skeleton className="h-[25rem] w-full" />
          <Skeleton className="h-[25rem] w-full" />
        </div>
      </div>
    )
  }

  if (dashboardQuery.isError || !dashboard) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Painel médico"
          title="Não foi possível carregar estas informações"
          description="Tente novamente em alguns instantes."
          actions={
            <Button onClick={() => dashboardQuery.refetch()} variant="secondary">
              Tentar novamente
            </Button>
          }
        />
      </div>
    )
  }

  const hasPatients = dashboard.summary.patientsTracked > 0

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Painel médico"
        title="Painel médico"
        description="Acompanhe seus pacientes e consulte a evolução registrada no FibroSync."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {periodOptions.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={periodDays === option ? 'default' : 'secondary'}
                onClick={() => setPeriodDays(option)}
              >
                {option} dias
              </Button>
            ))}
            <Button asChild size="sm" variant="secondary">
              <Link to="/medical/patients">Meus pacientes</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pacientes acompanhados"
          value={String(dashboard.summary.patientsTracked)}
          hint="Pacientes com vínculo ativo"
          icon={UsersRound}
        />
        <StatCard
          label="Registros recentes"
          value={String(dashboard.summary.recentRecords)}
          hint={`Entradas no período de ${dashboard.summary.periodDays} dias`}
          icon={ClipboardList}
        />
        <StatCard
          label="Pacientes com atividade recente"
          value={String(dashboard.summary.patientsWithRecentActivity)}
          hint="Registro recente nos últimos dias"
          icon={Activity}
        />
        <StatCard
          label="Acompanhamentos pendentes"
          value={String(dashboard.summary.pendingFollowUps)}
          hint="Pacientes sem atividade recente para revisão"
          icon={FileClock}
        />
      </div>

      {!hasPatients ? (
        <div className="card-surface p-6">
          <p className="section-label">Sem pacientes</p>
          <h2 className="mt-2 text-xl font-semibold md:text-2xl">
            Nenhum paciente vinculado
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Quando um paciente autorizar seu acompanhamento, ele aparecerá aqui
            para consulta clínica.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
          <div className="space-y-5">
            <div className="card-surface p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="section-label">Evolução da dor</p>
                  <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                    Média diária entre pacientes acompanhados
                  </h2>
                </div>
                <Badge variant="neutral">
                  Período de {dashboard.summary.periodDays} dias
                </Badge>
              </div>
              <div className="mt-5">
                <TrendLineChart
                  data={dashboard.painSeries}
                  height={280}
                  primaryLabel="Dor"
                  yDomain={[0, 10]}
                  yTicks={[0, 2, 4, 6, 8, 10]}
                  tooltipValueFormatter={(value) => `${value.toFixed(1)}/10`}
                  emptyState={{
                    title: 'Ainda não há registros neste período',
                    description: 'A evolução diária aparecerá aqui quando houver dados.',
                  }}
                  singleRecordState={{
                    title: 'Apenas um dia com registro',
                    description:
                      'A tendência ficará mais clara conforme novos dados forem registrados.',
                  }}
                />
              </div>
            </div>

            <div className="card-surface p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-label">Pacientes vinculados</p>
                  <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                    Lista com atualização recente
                  </h2>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link to="/medical/patients">Ver todos</Link>
                </Button>
              </div>

              <div className="mt-5 space-y-3">
                {dashboard.patients.map((patient) => (
                  <Link
                    key={patient.patientId}
                    to={`/medical/patients/${patient.patientId}`}
                    className="flex items-center gap-4 rounded-[1.25rem] border border-white/80 bg-white/84 px-4 py-3.5 shadow-soft transition hover:-translate-y-[1px] hover:border-brand-200/60"
                  >
                    <Avatar>
                      <AvatarFallback>
                        {patient.fullName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {patient.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {patient.lastRecordAt
                          ? `Último registro: ${formatMedicalDate(patient.lastRecordAt)}`
                          : 'Sem registros recentes'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-brand-700">
                        {patient.latestPainLevel !== null
                          ? `${patient.latestPainLevel}/10`
                          : '--'}
                      </p>
                      <Badge variant={resolveFollowUpTone(patient.followUpStatus)}>
                        {patient.followUpLabel}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card-surface p-5">
              <p className="section-label">Sintomas registrados</p>
              <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                Principais sintomas no período
              </h2>
              <div className="mt-5 space-y-3">
                {dashboard.topSymptoms.length > 0 ? (
                  dashboard.topSymptoms.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/70 bg-white/78 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Presente em {item.recordsCount} registros
                        </p>
                      </div>
                      <Badge variant="neutral">{item.percentage}%</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Ainda não há sintomas associados suficientes para resumir
                    este período.
                  </p>
                )}
              </div>
            </div>

            <div className="card-surface p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="section-label">Atualizações recentes</p>
                  <h2 className="mt-1 text-xl font-semibold md:text-2xl">
                    Atividade clínica
                  </h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {dashboard.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-[1rem] border border-white/75 bg-white/82 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {activity.title}
                      </p>
                      <Badge variant="neutral">{activity.patientName}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatMedicalDateTime(activity.occurredAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
