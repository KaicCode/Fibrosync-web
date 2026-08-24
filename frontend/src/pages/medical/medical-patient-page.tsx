import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  Brain,
  CloudSun,
  FileText,
  HeartPulse,
  MoonStar,
  NotebookPen,
  Sparkles,
  Waves,
} from 'lucide-react'
import { useParams, useSearchParams } from 'react-router-dom'
import { BodyMap } from '@/components/body-map'
import { TrendLineChart } from '@/components/charts/trend-line-chart'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { usePageTitle } from '@/hooks/use-page-title'
import { resolvePainDescriptor } from '@/features/clinical/clinical-model'
import {
  doctorService,
  type DoctorNote,
  type DoctorPeriodDays,
} from '@/services/doctor.service'
import { toast } from '@/store/toast-store'
import {
  formatMedicalDate,
  formatMedicalDateTime,
  formatMedicalNumber,
  mapDaysToReportPeriod,
  resolveBodyAreaLabel,
  resolvePeriodWindow,
} from './medical-shared'

const periodOptions: DoctorPeriodDays[] = [7, 30, 90]

type PatientTab = 'summary' | 'history' | 'reports' | 'notes'

function resolveInitialTab(value: string | null): PatientTab {
  if (value === 'history' || value === 'reports' || value === 'notes') {
    return value
  }

  return 'summary'
}

function resolveTrendHint(value: number | null, suffix: string): string {
  if (value === null) {
    return 'Sem dados suficientes no período'
  }

  return `${formatMedicalNumber(value)}${suffix}`
}

export function MedicalPatientPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [periodDays, setPeriodDays] = useState<DoctorPeriodDays>(30)
  const [draftNote, setDraftNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const queryClient = useQueryClient()

  const activeTab = resolveInitialTab(searchParams.get('tab'))
  const windowRange = resolvePeriodWindow(periodDays)

  usePageTitle('Acompanhamento do paciente')

  const patientQuery = useQuery({
    queryKey: ['doctorPatient', patientId, periodDays],
    queryFn: () => doctorService.getPatient(patientId!, periodDays),
    enabled: Boolean(patientId),
  })

  const recordsQuery = useQuery({
    queryKey: ['doctorPatientRecords', patientId, periodDays],
    queryFn: () =>
      doctorService.getPatientRecords(patientId!, {
        includeAll: true,
        dateFrom: windowRange.dateFrom,
        dateTo: windowRange.dateTo,
      }),
    enabled: Boolean(patientId) && (activeTab === 'summary' || activeTab === 'history'),
  })

  const reportsQuery = useQuery({
    queryKey: ['doctorPatientReports', patientId],
    queryFn: () =>
      doctorService.getPatientReports(patientId!, {
        page: 1,
        limit: 20,
      }),
    enabled: Boolean(patientId) && activeTab === 'reports',
  })

  const notesQuery = useQuery({
    queryKey: ['doctorPatientNotes', patientId],
    queryFn: () =>
      doctorService.getPatientNotes(patientId!, {
        page: 1,
        limit: 30,
      }),
    enabled: Boolean(patientId) && activeTab === 'notes',
  })

  const generateReportMutation = useMutation({
    mutationFn: () =>
      doctorService.generatePatientReport(
        patientId!,
        mapDaysToReportPeriod(periodDays),
      ),
    onSuccess: () => {
      toast.success(
        'Relatório atualizado',
        'O relatório do paciente foi gerado com base no período selecionado.',
      )
      void queryClient.invalidateQueries({
        queryKey: ['doctorPatientReports', patientId],
      })
    },
    onError: () => {
      toast.error(
        'Não foi possível gerar o relatório',
        'Tente novamente em alguns instantes.',
      )
    },
  })

  const createNoteMutation = useMutation({
    mutationFn: () => doctorService.createPatientNote(patientId!, draftNote),
    onSuccess: () => {
      setDraftNote('')
      toast.success(
        'Observação registrada',
        'Esta observação é visível apenas para você.',
      )
      void queryClient.invalidateQueries({
        queryKey: ['doctorPatientNotes', patientId],
      })
    },
    onError: () => {
      toast.error(
        'Não foi possível salvar a observação',
        'Tente novamente.',
      )
    },
  })

  const updateNoteMutation = useMutation({
    mutationFn: (note: DoctorNote) =>
      doctorService.updateNote(note.id, editingContent),
    onSuccess: () => {
      setEditingNoteId(null)
      setEditingContent('')
      toast.success('Observação atualizada')
      void queryClient.invalidateQueries({
        queryKey: ['doctorPatientNotes', patientId],
      })
    },
    onError: () => {
      toast.error(
        'Não foi possível atualizar a observação',
        'Tente novamente.',
      )
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => doctorService.deleteNote(noteId),
    onSuccess: () => {
      toast.success('Observação removida')
      void queryClient.invalidateQueries({
        queryKey: ['doctorPatientNotes', patientId],
      })
    },
    onError: () => {
      toast.error(
        'Não foi possível remover a observação',
        'Tente novamente.',
      )
    },
  })

  if (!patientId) {
    return null
  }

  if (patientQuery.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
        <Skeleton className="h-[32rem] w-full" />
      </div>
    )
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Paciente"
          title="Não foi possível carregar estas informações"
          description="Tente novamente."
          actions={
            <Button variant="secondary" onClick={() => patientQuery.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      </div>
    )
  }

  const patient = patientQuery.data
  const history = recordsQuery.data?.items ?? []
  const reports = reportsQuery.data?.items ?? []
  const notes = notesQuery.data?.items ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Acompanhamento clínico"
        title={patient.patient.fullName}
        description="Consulte a evolução registrada no FibroSync e mantenha observações privadas do acompanhamento."
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
              size="sm"
              variant="secondary"
              onClick={() => {
                setSearchParams((current) => {
                  const nextParams = new URLSearchParams(current)
                  nextParams.set('tab', 'reports')
                  return nextParams
                })
              }}
            >
              Relatórios
            </Button>
          </div>
        }
      />

      <div className="card-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">
                Vínculo {patient.patient.accessStatus.toLowerCase()}
              </Badge>
              {patient.patient.sharingEnabled ? (
                <Badge variant="success">Compartilhamento clínico ativo</Badge>
              ) : (
                <Badge variant="warning">Compartilhamento clínico inativo</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Último registro:{' '}
              {patient.patient.lastRecordAt
                ? formatMedicalDate(patient.patient.lastRecordAt)
                : 'Sem registros neste período'}
            </p>
            <p className="text-sm text-muted-foreground">
              Faixa analisada: {formatMedicalDate(patient.window.start)} até{' '}
              {formatMedicalDate(patient.window.end)}
            </p>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="rounded-[1rem] border border-white/80 bg-white/78 px-4 py-3">
              <p className="font-semibold text-foreground">Idade</p>
              <p>{patient.patient.age !== null ? `${patient.patient.age} anos` : 'Não informada'}</p>
            </div>
            <div className="rounded-[1rem] border border-white/80 bg-white/78 px-4 py-3">
              <p className="font-semibold text-foreground">País</p>
              <p>{patient.patient.countryCode ?? 'Não informado'}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(nextTab) =>
          setSearchParams((current) => {
            const nextParams = new URLSearchParams(current)
            nextParams.set('tab', nextTab)
            return nextParams
          })
        }
      >
        <TabsList>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="notes">Observações</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Dor média no período"
              value={
                patient.summary.averagePainLevel !== null
                  ? `${formatMedicalNumber(patient.summary.averagePainLevel)}/10`
                  : '--'
              }
              hint="Média dos registros no período selecionado"
              icon={HeartPulse}
            />
            <StatCard
              label="Último registro"
              value={
                patient.summary.latestPainLevel !== null
                  ? `${patient.summary.latestPainLevel}/10`
                  : '--'
              }
              hint={
                patient.summary.latestRecordDate
                  ? formatMedicalDate(patient.summary.latestRecordDate)
                  : 'Ainda sem registros neste período'
              }
              icon={Activity}
            />
            <StatCard
              label="Dias acompanhados"
              value={`${patient.summary.trackedDays} de ${patient.summary.expectedDays}`}
              hint="Dias com registros dentro da janela escolhida"
              icon={NotebookPen}
            />
            <StatCard
              label="Sono médio"
              value={resolveTrendHint(patient.summary.averageSleepHours, 'h')}
              hint="Média das horas dormidas"
              icon={MoonStar}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Evolução da dor</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendLineChart
                  data={patient.charts.pain}
                  height={280}
                  primaryLabel="Dor"
                  yDomain={[0, 10]}
                  yTicks={[0, 2, 4, 6, 8, 10]}
                  tooltipValueFormatter={(value) => `${value.toFixed(1)}/10`}
                  emptyState={{
                    title: 'Ainda não há registros neste período',
                    description: 'A evolução aparecerá aqui assim que houver dados.',
                  }}
                  singleRecordState={{
                    title: 'Há apenas um dia com registro',
                    description: 'Novos registros ajudam a visualizar a tendência.',
                  }}
                />
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Nível de atenção calculado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Badge
                      variant={
                        patient.analysis.rules.attentionLevel === 'Elevado' ||
                        patient.analysis.rules.attentionLevel === 'Muito elevado'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {patient.analysis.rules.attentionLevel ?? 'Sem cálculo recente'}
                    </Badge>
                    <p className="text-2xl font-semibold text-foreground">
                      {patient.analysis.rules.attentionScore !== null
                        ? `${patient.analysis.rules.attentionScore}/100`
                        : '--'}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {patient.analysis.rules.explanation}
                  </p>
                  {patient.analysis.rules.recommendationSummary ? (
                    <p className="rounded-[1rem] border border-white/75 bg-white/82 px-4 py-3 text-sm leading-6 text-muted-foreground">
                      {patient.analysis.rules.recommendationSummary}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Análise complementar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-600" />
                    <p className="text-sm font-semibold text-foreground">
                      {patient.analysis.ai.available
                        ? 'Análise com IA disponível'
                        : 'Análise com IA ainda não disponível'}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {patient.analysis.ai.available
                      ? patient.analysis.ai.explanation
                      : 'Ainda não há análise complementar suficiente neste período.'}
                  </p>
                  {patient.analysis.ai.suggestedAction ? (
                    <p className="rounded-[1rem] border border-white/75 bg-white/82 px-4 py-3 text-sm leading-6 text-muted-foreground">
                      {patient.analysis.ai.suggestedAction}
                    </p>
                  ) : null}
                  <p className="text-xs leading-5 text-muted-foreground">
                    {patient.analysis.ai.disclaimer}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sono e recuperação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <TrendLineChart
                  data={patient.charts.sleepHours}
                  height={220}
                  primaryLabel="Horas dormidas"
                  tooltipValueFormatter={(value) => `${value.toFixed(1)}h`}
                  emptyState={{
                    title: 'Ainda não há dados de sono',
                    description: 'As horas dormidas aparecerão aqui quando forem registradas.',
                  }}
                  singleRecordState={{
                    title: 'Há apenas um dia com dados',
                    description: 'Continue acompanhando para observar mudanças.',
                  }}
                />
                <TrendLineChart
                  data={patient.charts.sleepQuality}
                  height={220}
                  primaryLabel="Qualidade do sono"
                  yDomain={[0, 10]}
                  yTicks={[0, 2, 4, 6, 8, 10]}
                  tooltipValueFormatter={(value) => `${value.toFixed(1)}/10`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fadiga, estresse, humor e rigidez</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <TrendLineChart
                  data={patient.charts.fatigue}
                  height={180}
                  primaryLabel="Fadiga"
                  yDomain={[0, 10]}
                  yTicks={[0, 2, 4, 6, 8, 10]}
                  tooltipValueFormatter={(value) => `${value.toFixed(1)}/10`}
                />
                <TrendLineChart
                  data={patient.charts.stress}
                  height={180}
                  primaryLabel="Estresse"
                  yDomain={[0, 10]}
                  yTicks={[0, 2, 4, 6, 8, 10]}
                  tooltipValueFormatter={(value) => `${value.toFixed(1)}/10`}
                />
                <TrendLineChart
                  data={patient.charts.mood}
                  height={180}
                  primaryLabel="Humor"
                  yDomain={[0, 10]}
                  yTicks={[0, 2, 4, 6, 8, 10]}
                  tooltipValueFormatter={(value) => `${value.toFixed(1)}/10`}
                />
                <TrendLineChart
                  data={patient.charts.stiffness}
                  height={180}
                  primaryLabel="Rigidez"
                  yDomain={[0, 10]}
                  yTicks={[0, 2, 4, 6, 8, 10]}
                  tooltipValueFormatter={(value) => `${value.toFixed(1)}/10`}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Regiões do corpo</CardTitle>
              </CardHeader>
              <CardContent>
                <BodyMap
                  frontSelectedAreas={patient.bodyMap.frontSelectedAreas}
                  backSelectedAreas={patient.bodyMap.backSelectedAreas}
                  onToggleFrontArea={() => {}}
                  onToggleBackArea={() => {}}
                  readOnly
                />
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Regiões mais registradas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.bodyMap.topAreas.length > 0 ? (
                    patient.bodyMap.topAreas.map((area) => (
                      <div
                        key={`${area.side}-${area.areaId}`}
                        className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/75 bg-white/82 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {resolveBodyAreaLabel(area.areaId)}
                        </p>
                        <Badge variant="neutral">{area.count} registros</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">
                      Ainda não há áreas corporais suficientes neste período.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gatilhos mais registrados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.triggers.length > 0 ? (
                    patient.triggers.map((trigger) => (
                      <div
                        key={trigger.label}
                        className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/75 bg-white/82 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {trigger.label}
                        </p>
                        <Badge variant="neutral">{trigger.count}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">
                      O paciente ainda não marcou gatilhos suficientes neste período.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sintomas registrados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patient.symptoms.length > 0 ? (
                  patient.symptoms.map((symptom) => (
                    <div
                      key={symptom.label}
                      className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/75 bg-white/82 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {symptom.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Presente em {symptom.count} registros
                        </p>
                      </div>
                      <Badge variant="neutral">{symptom.percentage}%</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Ainda não há sintomas associados suficientes para este período.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contexto climático</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.weatherContext.available ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1rem] border border-white/75 bg-white/82 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Temperatura média
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {formatMedicalNumber(
                            patient.weatherContext.averageTemperature,
                          )}
                          °C
                        </p>
                      </div>
                      <div className="rounded-[1rem] border border-white/75 bg-white/82 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Umidade média
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {formatMedicalNumber(
                            patient.weatherContext.averageHumidity,
                          )}
                          %
                        </p>
                      </div>
                      <div className="rounded-[1rem] border border-white/75 bg-white/82 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Pressão média
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {formatMedicalNumber(
                            patient.weatherContext.averagePressure,
                          )}
                          hPa
                        </p>
                      </div>
                    </div>
                    {patient.weatherContext.latestSnapshot ? (
                      <div className="rounded-[1rem] border border-brand-100 bg-brand-50/65 px-4 py-3 text-sm leading-6 text-brand-900">
                        <div className="flex items-center gap-2 font-semibold">
                          <CloudSun className="h-4 w-4" />
                          Registro climático mais recente
                        </div>
                        <p className="mt-2">
                          Temperatura de{' '}
                          {formatMedicalNumber(
                            patient.weatherContext.latestSnapshot.temperature,
                          )}
                          °C, umidade de{' '}
                          {formatMedicalNumber(
                            patient.weatherContext.latestSnapshot.humidity,
                          )}
                          % e pressão de{' '}
                          {formatMedicalNumber(
                            patient.weatherContext.latestSnapshot.pressure,
                          )}
                          hPa.
                        </p>
                      </div>
                    ) : null}
                    <p className="text-sm leading-6 text-muted-foreground">
                      {patient.weatherContext.note}
                    </p>
                  </>
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Ainda não há contexto climático suficiente neste período.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {recordsQuery.isLoading ? (
            <Skeleton className="h-[24rem] w-full" />
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Ainda não há registros neste período
                </h2>
              </CardContent>
            </Card>
          ) : (
            history.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>{formatMedicalDate(record.recordDate)}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Registro criado em {formatMedicalDateTime(record.createdAt)}
                      </p>
                    </div>
                    <Badge variant={resolvePainDescriptor(record.painLevel).tone === 'rose' ? 'warning' : 'neutral'}>
                      Dor {record.painLevel}/10
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoTile label="Fadiga" value={`${record.fatigueLevel}/10`} icon={Waves} />
                    <InfoTile label="Estresse" value={`${record.stressLevel}/10`} icon={Brain} />
                    <InfoTile
                      label="Sono"
                      value={
                        record.sleepHours !== null
                          ? `${formatMedicalNumber(record.sleepHours)}h`
                          : '--'
                      }
                      icon={MoonStar}
                    />
                    <InfoTile label="Humor" value={`${record.moodLevel}/10`} icon={Sparkles} />
                  </div>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <RecordList
                      title="Gatilhos"
                      items={record.painTriggers}
                      emptyMessage="Sem gatilhos registrados"
                    />
                    <RecordList
                      title="Áreas do corpo"
                      items={[
                        ...record.frontPainAreas.map(resolveBodyAreaLabel),
                        ...record.backPainAreas.map(resolveBodyAreaLabel),
                      ]}
                      emptyMessage="Sem áreas corporais registradas"
                    />
                  </div>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <RecordList
                      title="Sintomas"
                      items={record.symptomEntries.map(
                        (item) => `${item.symptomName} (${item.severity}/10)`,
                      )}
                      emptyMessage="Sem sintomas associados"
                    />
                    <RecordList
                      title="Observações do paciente"
                      items={record.notes ? [record.notes] : []}
                      emptyMessage="Sem observações neste registro"
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Relatórios do paciente</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    As informações refletem registros realizados pelo paciente no
                    FibroSync e devem ser interpretadas em conjunto com
                    avaliação profissional.
                  </p>
                </div>
                <Button
                  onClick={() => generateReportMutation.mutate()}
                  disabled={generateReportMutation.isPending}
                >
                  <FileText className="h-4 w-4" />
                  {generateReportMutation.isPending
                    ? 'Gerando relatório...'
                    : 'Gerar relatório do período'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportsQuery.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : reports.length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Nenhum relatório disponível.
                </p>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-[1rem] border border-white/75 bg-white/82 px-4 py-3"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatMedicalDate(report.periodStart)} até{' '}
                          {formatMedicalDate(report.periodEnd)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Gerado em {formatMedicalDateTime(report.generatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{report.type}</Badge>
                        {report.fileUrl ? (
                          <Button asChild size="sm" variant="secondary">
                            <a href={report.fileUrl} target="_blank" rel="noreferrer">
                              Abrir
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Observações profissionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-[1rem] border border-brand-100 bg-brand-50/65 px-4 py-3 text-sm leading-6 text-brand-900">
                Esta observação é visível apenas para você.
              </p>
              <Textarea
                value={draftNote}
                onChange={(event) => setDraftNote(event.target.value)}
                placeholder="Registre uma observação clínica relevante deste acompanhamento..."
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => createNoteMutation.mutate()}
                  disabled={createNoteMutation.isPending || draftNote.trim().length < 3}
                >
                  {createNoteMutation.isPending
                    ? 'Salvando...'
                    : 'Nova observação'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {notesQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : notes.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Nenhuma observação profissional registrada.
                </h2>
              </CardContent>
            </Card>
          ) : (
            notes.map((note) => (
              <Card key={note.id}>
                <CardHeader>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Observação profissional</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Criada em {formatMedicalDateTime(note.createdAt)}
                        {note.updatedAt !== note.createdAt
                          ? ` · Atualizada em ${formatMedicalDateTime(note.updatedAt)}`
                          : ''}
                      </p>
                    </div>
                    <Badge variant="neutral">Privada</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingNoteId === note.id ? (
                    <Textarea
                      value={editingContent}
                      onChange={(event) => setEditingContent(event.target.value)}
                    />
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">
                      {note.content}
                    </p>
                  )}
                  <div className="flex flex-wrap justify-end gap-2">
                    {editingNoteId === note.id ? (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingNoteId(null)
                            setEditingContent('')
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => updateNoteMutation.mutate(note)}
                          disabled={editingContent.trim().length < 3}
                        >
                          Salvar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingNoteId(note.id)
                            setEditingContent(note.content)
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                        >
                          Excluir
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoTile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Activity
}) {
  return (
    <div className="rounded-[1rem] border border-white/75 bg-white/82 px-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <p className="text-xs uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

function RecordList({
  title,
  items,
  emptyMessage,
}: {
  title: string
  items: string[]
  emptyMessage: string
}) {
  return (
    <div className="rounded-[1rem] border border-white/75 bg-white/82 px-4 py-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant="neutral">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {emptyMessage}
        </p>
      )}
    </div>
  )
}
