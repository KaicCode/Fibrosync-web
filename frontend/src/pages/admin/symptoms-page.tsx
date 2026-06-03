import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Save, Stethoscope, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { AdminContentSection } from '@/components/admin/cards/content-section'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { usePageTitle } from '@/hooks/use-page-title'
import { adminService } from '@/services/admin.service'
import type {
  AdminCreateSymptomInput,
  AdminSymptomRecord,
  AdminUpdateSymptomInput,
} from '@/types/admin'

type SymptomFormState = {
  userId: string
  fatigueLevel: number
  sleepQuality: number
  stiffness: number
  mood: number
  stress: number
  cognitiveFog: boolean
  sensitivityLight: boolean
  sensitivityNoise: boolean
  digestiveIssues: boolean
  headache: boolean
  anxiety: boolean
  depression: boolean
  bodyTemperatureFeeling: string
  notes: string
}

function createEmptySymptomForm(): SymptomFormState {
  return {
    userId: '',
    fatigueLevel: 5,
    sleepQuality: 5,
    stiffness: 0,
    mood: 6,
    stress: 4,
    cognitiveFog: false,
    sensitivityLight: false,
    sensitivityNoise: false,
    digestiveIssues: false,
    headache: false,
    anxiety: false,
    depression: false,
    bodyTemperatureFeeling: '',
    notes: '',
  }
}

function mapSymptomToForm(record: AdminSymptomRecord): SymptomFormState {
  return {
    userId: record.userId,
    fatigueLevel: record.fatigueLevel,
    sleepQuality: record.sleepQuality,
    stiffness: record.stiffness,
    mood: record.mood,
    stress: record.stress,
    cognitiveFog: record.cognitiveFog,
    sensitivityLight: record.sensitivityLight,
    sensitivityNoise: record.sensitivityNoise,
    digestiveIssues: record.digestiveIssues,
    headache: record.headache,
    anxiety: record.anxiety,
    depression: record.depression,
    bodyTemperatureFeeling: record.bodyTemperatureFeeling ?? '',
    notes: record.notes ?? '',
  }
}

function clampScale(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), 10)
}

function buildCreatePayload(form: SymptomFormState): AdminCreateSymptomInput {
  return {
    userId: form.userId,
    fatigueLevel: clampScale(form.fatigueLevel),
    sleepQuality: clampScale(form.sleepQuality),
    stiffness: clampScale(form.stiffness),
    mood: clampScale(form.mood),
    stress: clampScale(form.stress),
    cognitiveFog: form.cognitiveFog,
    sensitivityLight: form.sensitivityLight,
    sensitivityNoise: form.sensitivityNoise,
    digestiveIssues: form.digestiveIssues,
    headache: form.headache,
    anxiety: form.anxiety,
    depression: form.depression,
    bodyTemperatureFeeling: form.bodyTemperatureFeeling.trim() || undefined,
    notes: form.notes.trim() || undefined,
  }
}

function buildUpdatePayload(form: SymptomFormState): AdminUpdateSymptomInput {
  return {
    fatigueLevel: clampScale(form.fatigueLevel),
    sleepQuality: clampScale(form.sleepQuality),
    stiffness: clampScale(form.stiffness),
    mood: clampScale(form.mood),
    stress: clampScale(form.stress),
    cognitiveFog: form.cognitiveFog,
    sensitivityLight: form.sensitivityLight,
    sensitivityNoise: form.sensitivityNoise,
    digestiveIssues: form.digestiveIssues,
    headache: form.headache,
    anxiety: form.anxiety,
    depression: form.depression,
    bodyTemperatureFeeling: form.bodyTemperatureFeeling.trim() || undefined,
    notes: form.notes.trim() || undefined,
  }
}

function listActiveFlags(record: Pick<
  AdminSymptomRecord,
  | 'cognitiveFog'
  | 'sensitivityLight'
  | 'sensitivityNoise'
  | 'digestiveIssues'
  | 'headache'
  | 'anxiety'
  | 'depression'
>): string[] {
  const labels: string[] = []

  if (record.cognitiveFog) labels.push('Fibro fog')
  if (record.sensitivityLight) labels.push('Luz')
  if (record.sensitivityNoise) labels.push('Ruido')
  if (record.digestiveIssues) labels.push('Digestivo')
  if (record.headache) labels.push('Cefaleia')
  if (record.anxiety) labels.push('Ansiedade')
  if (record.depression) labels.push('Humor depressivo')

  return labels
}

export function AdminSymptomsPage() {
  usePageTitle('Gerenciar Sintomas')

  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterUserId, setFilterUserId] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<AdminSymptomRecord | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState<SymptomFormState>(() => createEmptySymptomForm())
  const [feedback, setFeedback] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const usersQuery = useQuery({
    queryKey: ['admin-users-options'],
    queryFn: () => adminService.getUsers({ page: 1, limit: 100 }),
  })

  const symptomsQuery = useQuery({
    queryKey: ['admin-symptoms', page, search, filterUserId],
    queryFn: () =>
      adminService.getSymptoms({
        page,
        limit: 10,
        search: search.trim() || undefined,
        userId: filterUserId || undefined,
      }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: AdminCreateSymptomInput) => adminService.createSymptom(payload),
    onSuccess: (record) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-symptoms'] })
      setFeedback('Registro de sintomas criado com sucesso.')
      setSubmitError(null)
      setSelectedRecord(record)
      setIsCreating(false)
      setForm(mapSymptomToForm(record))
    },
    onError: (error) => {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel criar o registro de sintomas.',
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      symptomId,
      payload,
    }: {
      symptomId: string
      payload: AdminUpdateSymptomInput
    }) => adminService.updateSymptom(symptomId, payload),
    onSuccess: (record) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-symptoms'] })
      setFeedback('Registro de sintomas atualizado com sucesso.')
      setSubmitError(null)
      setSelectedRecord(record)
      setForm(mapSymptomToForm(record))
    },
    onError: (error) => {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel atualizar o registro de sintomas.',
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (symptomId: string) => adminService.deleteSymptom(symptomId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-symptoms'] })
      setFeedback('Registro de sintomas removido com sucesso.')
      setSubmitError(null)
      setSelectedRecord(null)
      setIsCreating(false)
      setForm(createEmptySymptomForm())
    },
    onError: (error) => {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel remover o registro de sintomas.',
      )
    },
  })

  const users = usersQuery.data?.items ?? []
  const symptomList = symptomsQuery.data?.items ?? []
  const pagination = symptomsQuery.data?.meta
  const isLinkedRecord = Boolean(selectedRecord?.dailyRecordId)

  function handleSelectRecord(record: AdminSymptomRecord) {
    setSelectedRecord(record)
    setIsCreating(false)
    setForm(mapSymptomToForm(record))
    setFeedback(null)
    setSubmitError(null)
  }

  function handleStartCreate() {
    setSelectedRecord(null)
    setIsCreating(true)
    setForm(createEmptySymptomForm())
    setFeedback(null)
    setSubmitError(null)
  }

  async function handleSubmit() {
    setFeedback(null)
    setSubmitError(null)

    if (!form.userId && isCreating) {
      setSubmitError('Selecione um paciente para criar o registro.')
      return
    }

    if (isCreating) {
      await createMutation.mutateAsync(buildCreatePayload(form))
      return
    }

    if (!selectedRecord) {
      return
    }

    await updateMutation.mutateAsync({
      symptomId: selectedRecord.id,
      payload: buildUpdatePayload(form),
    })
  }

  async function handleDelete() {
    if (!selectedRecord) {
      return
    }

    const confirmed = window.confirm(
      `Deseja realmente excluir o registro de sintomas de ${selectedRecord.user.fullName}?`,
    )

    if (!confirmed) {
      return
    }

    await deleteMutation.mutateAsync(selectedRecord.id)
  }

  const editingMode = isCreating ? 'create' : selectedRecord ? 'edit' : 'idle'
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sintomas"
        title="Central de sinais clinicos"
        description="Acompanhe, organize e ajuste os registros de sintomas pela area administrativa."
        actions={
          <Button onClick={handleStartCreate}>
            <Stethoscope className="h-4 w-4" />
            Novo registro
          </Button>
        }
      />

      {feedback ? (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {submitError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.9fr)]">
        <AdminContentSection
          title="Registros monitorados"
          description={`Total atual: ${pagination?.total ?? 0} sinais clinicos`}
          isLoading={symptomsQuery.isLoading}
        >
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Buscar por paciente, email, nota ou temperatura..."
            />

            <select
              value={filterUserId}
              onChange={(event) => {
                setFilterUserId(event.target.value)
                setPage(1)
              }}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="">Todos os pacientes</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Paciente
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Escalas
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Sintomas ativos
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Contexto
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Registro
                  </th>
                </tr>
              </thead>
              <tbody>
                {symptomList.map((record) => {
                  const activeFlags = listActiveFlags(record)

                  return (
                    <tr
                      key={record.id}
                      className="cursor-pointer border-b border-border transition-colors hover:bg-muted/40"
                      onClick={() => handleSelectRecord(record)}
                    >
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-foreground">
                          {record.user.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.user.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">
                        <p>Fadiga {record.fatigueLevel}/10</p>
                        <p>Sono {record.sleepQuality}/10</p>
                        <p>Rigidez {record.stiffness}/10</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {activeFlags.length > 0 ? (
                            activeFlags.map((label) => (
                              <Badge key={label} variant="neutral">
                                {label}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Sem flags ativas
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">
                        <p>{record.bodyTemperatureFeeling || 'Sem temperatura'}</p>
                        <p className="line-clamp-2 text-xs">
                          {record.notes || 'Sem observacoes'}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">
                        <p>
                          {record.dailyRecordId ? 'Vinculado ao diario' : 'Sinal isolado'}
                        </p>
                        <p className="text-xs">
                          {new Date(record.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {symptomList.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum registro de sintomas encontrado para os filtros atuais.
              </div>
            ) : null}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() =>
                  setPage((current) => Math.min(pagination.totalPages, current + 1))
                }
                disabled={page >= pagination.totalPages}
              >
                Proxima
              </Button>
            </div>
          ) : null}
        </AdminContentSection>

        <div className="card-surface space-y-5 p-6">
          {editingMode === 'idle' ? (
            <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <Plus className="h-8 w-8" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  Selecione um registro ou crie um novo sinal
                </p>
                <p className="text-sm">
                  O painel lateral centraliza o acompanhamento operacional dos sintomas.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-label">
                    {isCreating ? 'Novo sinal' : 'Edicao de sinal'}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">
                    {isCreating
                      ? 'Criar registro de sintomas'
                      : selectedRecord?.user.fullName ?? 'Atualizar sintomas'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isCreating
                      ? 'Associe o sinal clinico a um paciente e ajuste o estado observado.'
                      : 'Refine os sinais ativos sem sair do workspace admin.'}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedRecord(null)
                    setIsCreating(false)
                    setForm(createEmptySymptomForm())
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Paciente</label>
                <select
                  value={form.userId}
                  disabled={!isCreating}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      userId: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="">Selecione um paciente</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} - {user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['fatigueLevel', 'Fadiga'],
                  ['sleepQuality', 'Qualidade do sono'],
                  ['stiffness', 'Rigidez'],
                  ['mood', 'Humor'],
                  ['stress', 'Estresse'],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {label}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={form[key as keyof SymptomFormState] as number}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [key]: clampScale(Number(event.target.value)),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-[1.25rem] border border-white/70 bg-white/70 p-4">
                <p className="text-sm font-semibold text-foreground">Flags observadas</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ['cognitiveFog', 'Fibro fog'],
                    ['sensitivityLight', 'Sensibilidade a luz'],
                    ['sensitivityNoise', 'Sensibilidade a ruido'],
                    ['digestiveIssues', 'Alteracoes digestivas'],
                    ['headache', 'Cefaleia'],
                    ['anxiety', 'Ansiedade'],
                    ['depression', 'Humor depressivo'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={form[key as keyof SymptomFormState] as boolean}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            [key]: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-input"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Temperatura corporal percebida
                </label>
                <Input
                  value={form.bodyTemperatureFeeling}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bodyTemperatureFeeling: event.target.value,
                    }))
                  }
                  placeholder="Frio, neutro, quente..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Observacoes</label>
                <Textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className="min-h-[110px]"
                  placeholder="Contexto relevante observado pelo admin ou equipe..."
                />
              </div>

              {!isCreating && selectedRecord ? (
                <div className="grid gap-3 rounded-[1.25rem] border border-white/70 bg-white/70 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span>Tipo de origem</span>
                    <span className="font-medium text-foreground">
                      {selectedRecord.dailyRecordId ? 'Ligado ao diario' : 'Registro isolado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Atualizado em</span>
                    <span className="font-medium text-foreground">
                      {new Date(selectedRecord.updatedAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {isLinkedRecord ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                      Esse sinal veio de um registro diario. Para preservar a coerencia clinica,
                      edite o diario correspondente em vez de alterar este snapshot pelo admin.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => void handleSubmit()}
                  disabled={isSaving || (!isCreating && isLinkedRecord)}
                >
                  <Save className="h-4 w-4" />
                  {isCreating ? 'Criar registro' : 'Salvar alteracoes'}
                </Button>

                {!isCreating && selectedRecord ? (
                  <Button
                    variant="secondary"
                    onClick={() => void handleDelete()}
                    disabled={deleteMutation.isPending || isLinkedRecord}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir registro
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
