import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, FolderOpen, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePageTitle } from '@/hooks/use-page-title'
import {
  doctorService,
  type DoctorPeriodDays,
} from '@/services/doctor.service'
import { toast } from '@/store/toast-store'
import {
  formatMedicalDate,
  formatMedicalDateTime,
  mapDaysToReportPeriod,
} from './medical-shared'

const periodOptions: DoctorPeriodDays[] = [7, 30, 90]

export function MedicalReportsPage() {
  usePageTitle('Relatórios clínicos')

  const [selectedPatientIdOverride, setSelectedPatientIdOverride] = useState<
    string | null
  >(null)
  const [periodDays, setPeriodDays] = useState<DoctorPeriodDays>(30)
  const queryClient = useQueryClient()

  const patientsQuery = useQuery({
    queryKey: ['doctorReportsPatients'],
    queryFn: () =>
      doctorService.getPatients({
        page: 1,
        limit: 50,
        filter: 'all',
        periodDays: 30,
      }),
  })

  const patientItems = useMemo(
    () => patientsQuery.data?.items ?? [],
    [patientsQuery.data?.items],
  )
  const selectedPatientId = patientItems.some(
    (patient) => patient.patientId === selectedPatientIdOverride,
  )
    ? selectedPatientIdOverride
    : patientItems[0]?.patientId ?? null

  const selectedPatient = useMemo(
    () =>
      patientItems.find((patient) => patient.patientId === selectedPatientId) ??
      null,
    [patientItems, selectedPatientId],
  )

  const reportsQuery = useQuery({
    queryKey: ['doctorPatientReportsHub', selectedPatientId],
    queryFn: () =>
      doctorService.getPatientReports(selectedPatientId!, {
        page: 1,
        limit: 20,
      }),
    enabled: Boolean(selectedPatientId),
  })

  const generateReportMutation = useMutation({
    mutationFn: () =>
      doctorService.generatePatientReport(
        selectedPatientId!,
        mapDaysToReportPeriod(periodDays),
      ),
    onSuccess: () => {
      toast.success(
        'Relatório atualizado',
        'O relatório foi gerado com base no período selecionado.',
      )
      void queryClient.invalidateQueries({
        queryKey: ['doctorPatientReportsHub', selectedPatientId],
      })
    },
    onError: () => {
      toast.error(
        'Não foi possível gerar o relatório',
        'Tente novamente em alguns instantes.',
      )
    },
  })

  const hasPatients = patientItems.length > 0

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Relatórios clínicos"
        title="Central de relatórios dos pacientes vinculados"
        description="Selecione um paciente autorizado para consultar os relatórios disponíveis ou gerar um novo resumo do período."
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
            <Button
              onClick={() => generateReportMutation.mutate()}
              disabled={!selectedPatientId || generateReportMutation.isPending}
            >
              <FileText className="h-4 w-4" />
              {generateReportMutation.isPending
                ? 'Gerando...'
                : 'Gerar relatório'}
            </Button>
          </div>
        }
      />

      {patientsQuery.isLoading ? (
        <div className="grid gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <Skeleton className="h-[34rem] w-full" />
          <Skeleton className="h-[34rem] w-full" />
        </div>
      ) : patientsQuery.isError ? (
        <div className="card-surface p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Não foi possível carregar os pacientes vinculados
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tente novamente para consultar os relatórios disponíveis.
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => patientsQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : !hasPatients ? (
        <div className="card-surface p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <UsersRound className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Nenhum paciente vinculado
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Os relatórios aparecerão aqui assim que houver pacientes com vínculo
            ativo e compartilhamento clínico habilitado.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Pacientes autorizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patientItems.map((patient) => {
                const isActive = patient.patientId === selectedPatientId

                return (
                  <button
                    key={patient.patientId}
                    type="button"
                    onClick={() => setSelectedPatientIdOverride(patient.patientId)}
                    className={`w-full rounded-[1.2rem] border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-brand-200 bg-brand-50/60 shadow-soft'
                        : 'border-white/80 bg-white/82 hover:border-brand-100 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
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
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>
                    {selectedPatient?.fullName ?? 'Selecione um paciente'}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Consulte os relatórios disponíveis e abra o acompanhamento
                    completo quando precisar revisar registros e observações.
                  </p>
                </div>
                {selectedPatientId ? (
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/medical/patients/${selectedPatientId}?tab=reports`}>
                      Abrir acompanhamento
                    </Link>
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPatient ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryTile
                    label="Registros recentes"
                    value={String(selectedPatient.recentRecordCount)}
                  />
                  <SummaryTile
                    label="Dor recente"
                    value={
                      selectedPatient.latestPainLevel !== null
                        ? `${selectedPatient.latestPainLevel}/10`
                        : '--'
                    }
                  />
                  <SummaryTile
                    label="Último registro"
                    value={
                      selectedPatient.lastRecordAt
                        ? formatMedicalDate(selectedPatient.lastRecordAt)
                        : 'Sem registro'
                    }
                  />
                </div>
              ) : null}

              {reportsQuery.isLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : reportsQuery.isError ? (
                <div className="rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-5">
                  <p className="text-sm font-semibold text-foreground">
                    Não foi possível carregar os relatórios deste paciente.
                  </p>
                  <Button
                    className="mt-4"
                    size="sm"
                    variant="secondary"
                    onClick={() => reportsQuery.refetch()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : reportsQuery.data?.items.length ? (
                reportsQuery.data.items.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-4 shadow-soft"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatMedicalDate(report.periodStart)} até{' '}
                          {formatMedicalDate(report.periodEnd)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {report.generatedAt
                            ? `Gerado em ${formatMedicalDateTime(report.generatedAt)}`
                            : `Criado em ${formatMedicalDateTime(report.createdAt)}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            report.status === 'READY' || report.fileUrl
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {report.status}
                        </Badge>
                        {report.fileUrl ? (
                          <Button asChild size="sm" variant="secondary">
                            <a href={report.fileUrl} target="_blank" rel="noreferrer">
                              <FolderOpen className="h-4 w-4" />
                              Abrir arquivo
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-5">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Ainda não há relatórios disponíveis para este paciente.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/80 bg-white/82 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
