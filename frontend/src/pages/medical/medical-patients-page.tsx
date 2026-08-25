import { useDeferredValue, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { usePageTitle } from '@/hooks/use-page-title'
import {
  doctorService,
  type DoctorPatientFilter,
  type DoctorPeriodDays,
} from '@/services/doctor.service'
import { professionalLinksService } from '@/services/professional-links.service'
import { useAppStore } from '@/store/app-store'
import { toast } from '@/store/toast-store'
import {
  formatMedicalDate,
  formatMedicalDateTime,
  resolveFollowUpTone,
} from './medical-shared'

const filterOptions: Array<{
  value: DoctorPatientFilter
  label: string
}> = [
  { value: 'all', label: 'Todos' },
  { value: 'recent', label: 'Atualização recente' },
  { value: 'stale', label: 'Sem registro recente' },
  { value: 'incomplete', label: 'Perfil incompleto' },
]

export function MedicalPatientsPage() {
  usePageTitle('Meus pacientes')

  const authSession = useAppStore((state) => state.authSession)
  const canManageInviteCodes = authSession?.user.role === 'MEDICAL'
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<DoctorPatientFilter>('all')
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false)
  const [linkCode, setLinkCode] = useState('')
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookupResult, setLookupResult] = useState<Awaited<
    ReturnType<typeof professionalLinksService.lookupPatientByCode>
  > | null>(null)
  const deferredSearch = useDeferredValue(search)
  const queryClient = useQueryClient()

  const patientsQuery = useQuery({
    queryKey: ['doctorPatients', deferredSearch, filter],
    queryFn: () =>
      doctorService.getPatients({
        search: deferredSearch.trim() || undefined,
        filter,
        periodDays: 30 as DoctorPeriodDays,
        page: 1,
        limit: 24,
      }),
  })

  const requestsQuery = useQuery({
    queryKey: ['doctorPatientLinkRequests'],
    queryFn: () => professionalLinksService.listDoctorRequests(),
    enabled: canManageInviteCodes,
  })

  const lookupMutation = useMutation({
    mutationFn: (code: string) => professionalLinksService.lookupPatientByCode(code),
    onSuccess: (result) => {
      setLookupResult(result)
      setLookupError(null)
    },
    onError: (error) => {
      setLookupResult(null)
      setLookupError(
        error instanceof Error
          ? error.message
          : 'Não foi possível buscar este código agora.',
      )
    },
  })

  const requestMutation = useMutation({
    mutationFn: (code: string) => professionalLinksService.requestPatientLink(code),
    onSuccess: () => {
      toast.success(
        'Solicitação enviada',
        'Agora é necessário aguardar a autorização do paciente.',
      )
      setIsAddPatientDialogOpen(false)
      setLinkCode('')
      setLookupError(null)
      setLookupResult(null)
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['doctorPatientLinkRequests'] }),
        queryClient.invalidateQueries({ queryKey: ['doctorPatients'] }),
      ])
    },
    onError: (error) => {
      toast.error(
        'Não foi possível concluir esta ação',
        error instanceof Error ? error.message : 'Tente novamente.',
      )
    },
  })

  const pendingRequests = useMemo(
    () =>
      requestsQuery.data?.items.filter((item) => item.status === 'PENDING') ?? [],
    [requestsQuery.data?.items],
  )
  const updatedRequests = useMemo(
    () =>
      requestsQuery.data?.items.filter((item) => item.status !== 'PENDING') ?? [],
    [requestsQuery.data?.items],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Meus pacientes"
        title="Acompanhe apenas pacientes com vínculo ativo"
        description="A busca e os filtros abaixo consideram somente pacientes autorizados para acompanhamento clínico."
        actions={
          canManageInviteCodes ? (
            <Button onClick={() => setIsAddPatientDialogOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Adicionar paciente
            </Button>
          ) : undefined
        }
      />

      <div className="card-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar paciente..."
              className="h-12 rounded-[1.2rem] pl-11"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={filter === option.value ? 'default' : 'secondary'}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {canManageInviteCodes ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="card-surface p-5">
            <p className="section-label">Aguardando autorização</p>
            <h2 className="mt-2 text-xl font-semibold md:text-2xl">
              Solicitações pendentes
            </h2>
            <div className="mt-5 space-y-3">
              {requestsQuery.isLoading ? (
                <>
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </>
              ) : pendingRequests.length > 0 ? (
                pendingRequests.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.1rem] border border-white/80 bg-white/82 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {item.patient.maskedName}
                      </p>
                      <Badge variant="warning">Aguardando autorização</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Solicitação enviada em{' '}
                      {formatMedicalDateTime(item.requestedAt ?? item.updatedAt)}.
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Nenhuma solicitação aguardando resposta no momento.
                </p>
              )}
            </div>
          </div>

          <div className="card-surface p-5">
            <p className="section-label">Atualizações recentes</p>
            <h2 className="mt-2 text-xl font-semibold md:text-2xl">
              Solicitações já respondidas
            </h2>
            <div className="mt-5 space-y-3">
              {requestsQuery.isLoading ? (
                <>
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </>
              ) : updatedRequests.length > 0 ? (
                updatedRequests.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.1rem] border border-white/80 bg-white/82 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {item.patient.maskedName}
                      </p>
                      <Badge variant={item.status === 'REVOKED' ? 'neutral' : 'default'}>
                        {item.status === 'REJECTED'
                          ? 'Solicitação não aceita'
                          : 'Acesso removido'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.status === 'REJECTED'
                        ? 'A solicitação não foi aceita.'
                        : 'Seu acesso a este paciente foi encerrado.'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Nenhuma atualização recente de solicitação.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {patientsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : patientsQuery.isError || !patientsQuery.data ? (
        <div className="card-surface p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Não foi possível carregar estas informações
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tente novamente.
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => patientsQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : patientsQuery.data.items.length === 0 ? (
        <div className="card-surface p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <UsersRound className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Nenhum paciente vinculado
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Quando um paciente autorizar seu acompanhamento, ele aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {patientsQuery.data.items.map((patient) => (
            <div key={patient.patientId} className="card-surface p-5">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarFallback>
                    {patient.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-lg font-semibold text-foreground">
                      {patient.fullName}
                    </p>
                    <Badge variant={resolveFollowUpTone(patient.followUpStatus)}>
                      {patient.followUpLabel}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {patient.lastRecordAt
                      ? `Último registro: ${formatMedicalDate(patient.lastRecordAt)}`
                      : 'Sem registros recentes'}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1rem] border border-white/80 bg-white/78 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Registros recentes
                      </p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {patient.recentRecordCount}
                      </p>
                    </div>
                    <div className="rounded-[1rem] border border-white/80 bg-white/78 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Dor recente
                      </p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {patient.latestPainLevel !== null
                          ? `${patient.latestPainLevel}/10`
                          : '--'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button asChild>
                  <Link to={`/medical/patients/${patient.patientId}`}>
                    Ver acompanhamento
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={canManageInviteCodes && isAddPatientDialogOpen}
        onOpenChange={(nextOpen) => {
          setIsAddPatientDialogOpen(nextOpen)

          if (!nextOpen) {
            setLinkCode('')
            setLookupError(null)
            setLookupResult(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar paciente</DialogTitle>
            <DialogDescription>
              Use o código fornecido pelo paciente para enviar uma solicitação de acompanhamento.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <label className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Código do paciente
              </p>
              <Input
                value={linkCode}
                onChange={(event) => {
                  setLinkCode(event.target.value.toUpperCase())
                  setLookupError(null)
                }}
                placeholder="FS-XXXXXX"
                className="h-12 rounded-[1.2rem]"
              />
            </label>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => lookupMutation.mutate(linkCode.trim())}
                disabled={lookupMutation.isPending || linkCode.trim().length < 6}
              >
                {lookupMutation.isPending ? 'Buscando...' : 'Buscar paciente'}
              </Button>
            </div>

            {lookupError ? (
              <div
                aria-live="polite"
                className="rounded-[1rem] border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900"
              >
                {lookupError}
              </div>
            ) : null}

            {lookupResult ? (
              <div
                aria-live="polite"
                className="rounded-[1.2rem] border border-white/80 bg-white/84 px-4 py-4 shadow-soft"
              >
                <p className="section-label">Paciente encontrado</p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  {lookupResult.maskedName}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {lookupResult.note}
                </p>
                {lookupResult.existingStatus === 'ACTIVE' ? (
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Este paciente já está vinculado a você.
                  </p>
                ) : null}
                {lookupResult.existingStatus === 'PENDING' ? (
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Já existe uma solicitação aguardando resposta.
                  </p>
                ) : null}
                {lookupResult.existingStatus === 'REJECTED' ? (
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    A solicitação anterior não foi aceita. Você pode enviar uma nova solicitação.
                  </p>
                ) : null}
                {lookupResult.existingStatus === 'REVOKED' ? (
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    O acesso anterior foi removido. Você pode enviar uma nova solicitação.
                  </p>
                ) : null}

                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => requestMutation.mutate(linkCode.trim())}
                    disabled={!lookupResult.canRequest || requestMutation.isPending}
                  >
                    {requestMutation.isPending
                      ? 'Enviando...'
                      : 'Enviar solicitação'}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
