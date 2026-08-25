import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePageTitle } from '@/hooks/use-page-title'
import { professionalLinksService } from '@/services/professional-links.service'
import { useAppStore } from '@/store/app-store'
import { toast } from '@/store/toast-store'

function formatDate(value?: string | null): string {
  if (!value) {
    return 'Sem data registrada'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatProfessionalSummary(professional: {
  specialty: string | null
  professionalCouncilType: string | null
  professionalCouncilNumber: string | null
  professionalCouncilState: string | null
  professionalClinic: string | null
}) {
  const council =
    professional.professionalCouncilType && professional.professionalCouncilNumber
      ? `${professional.professionalCouncilType}-${professional.professionalCouncilState ?? '--'} ${professional.professionalCouncilNumber}`
      : 'Registro profissional não informado'

  return {
    specialty: professional.specialty ?? 'Especialidade não informada',
    council,
    clinic: professional.professionalClinic ?? null,
  }
}

async function copyText(value: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return true
  }

  if (typeof document === 'undefined') {
    return false
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  const success = document.execCommand('copy')
  document.body.removeChild(textarea)
  return success
}

export function ProfessionalsPage() {
  usePageTitle('Profissionais')

  const authSession = useAppStore((state) => state.authSession)
  const currentRole = authSession?.user.role
  const queryClient = useQueryClient()
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false)
  const [accessIdToRemove, setAccessIdToRemove] = useState<string | null>(null)
  const [expandedProfessionalId, setExpandedProfessionalId] = useState<string | null>(null)

  const codeQuery = useQuery({
    queryKey: ['patientProfessionalCode'],
    queryFn: () => professionalLinksService.getMyLinkCode(),
    enabled: currentRole === 'USER',
  })

  const requestsQuery = useQuery({
    queryKey: ['patientProfessionalRequests'],
    queryFn: () => professionalLinksService.getMyRequests(),
    enabled: currentRole === 'USER',
  })

  const professionalsQuery = useQuery({
    queryKey: ['patientAuthorizedProfessionals'],
    queryFn: () => professionalLinksService.getMyProfessionals(),
    enabled: currentRole === 'USER',
  })

  const regenerateMutation = useMutation({
    mutationFn: () => professionalLinksService.regenerateMyLinkCode(),
    onSuccess: () => {
      setIsRegenerateDialogOpen(false)
      toast.success(
        'Novo código gerado',
        'O código anterior deixou de funcionar para novas solicitações.',
      )
      void queryClient.invalidateQueries({
        queryKey: ['patientProfessionalCode'],
      })
    },
    onError: (error) => {
      toast.error(
        'Não foi possível gerar um novo código',
        error instanceof Error ? error.message : 'Tente novamente.',
      )
    },
  })

  const acceptMutation = useMutation({
    mutationFn: (accessId: string) => professionalLinksService.acceptRequest(accessId),
    onSuccess: () => {
      toast.success(
        'Profissional autorizado',
        'O acesso foi liberado com sucesso.',
      )
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['patientProfessionalRequests'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['patientAuthorizedProfessionals'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['patientProfessionalCode'],
        }),
      ])
    },
    onError: () => {
      toast.error(
        'Não foi possível concluir esta ação',
        'Tente novamente.',
      )
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (accessId: string) => professionalLinksService.rejectRequest(accessId),
    onSuccess: () => {
      toast.info('Solicitação recusada')
      void queryClient.invalidateQueries({
        queryKey: ['patientProfessionalRequests'],
      })
    },
    onError: () => {
      toast.error(
        'Não foi possível concluir esta ação',
        'Tente novamente.',
      )
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (accessId: string) => professionalLinksService.revokeProfessional(accessId),
    onSuccess: () => {
      setAccessIdToRemove(null)
      toast.success(
        'Acesso removido',
        'Este profissional não poderá mais visualizar seus registros.',
      )
      void queryClient.invalidateQueries({
        queryKey: ['patientAuthorizedProfessionals'],
      })
    },
    onError: () => {
      toast.error(
        'Não foi possível remover este acesso',
        'Tente novamente.',
      )
    },
  })

  const pendingCount = requestsQuery.data?.items.length ?? 0
  const activeProfessionals = useMemo(
    () => professionalsQuery.data?.items ?? [],
    [professionalsQuery.data?.items],
  )
  const globalSharingEnabled =
    codeQuery.data?.sharingEnabled ?? professionalsQuery.data?.sharingEnabled ?? false

  const professionalToRemove = useMemo(
    () =>
      activeProfessionals.find((item) => item.id === accessIdToRemove) ?? null,
    [accessIdToRemove, activeProfessionals],
  )

  if (currentRole !== 'USER') {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Profissionais"
          title="Área disponível apenas para contas de paciente"
          description="O gerenciamento de código de vínculo e autorizações só pode ser feito pelo próprio paciente."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Profissionais"
        title="Controle quem pode acompanhar seus registros"
        description="Ao aceitar, este profissional poderá acessar seus registros de acompanhamento no FibroSync. Você poderá remover esse acesso a qualquer momento."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Meu código de vínculo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Compartilhe este código somente com o profissional que deseja autorizar.
            </p>

            {codeQuery.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : codeQuery.isError || !codeQuery.data ? (
              <div className="rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-5">
                <p className="text-sm font-semibold text-foreground">
                  Não foi possível carregar seu código agora.
                </p>
                <Button
                  className="mt-4"
                  variant="secondary"
                  onClick={() => codeQuery.refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-brand-100 bg-brand-50/70 px-5 py-5">
                <p className="text-xs uppercase tracking-[0.18em] text-brand-700/80">
                  Meu código de vínculo
                </p>
                <p className="mt-3 break-all text-3xl font-semibold tracking-[0.24em] text-brand-900 md:text-4xl">
                  {codeQuery.data.code}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const success = await copyText(codeQuery.data.code)

                        if (!success) {
                          throw new Error('copy-failed')
                        }

                        toast.success(
                          'Código copiado',
                          'Agora você pode compartilhá-lo com seu profissional.',
                        )
                      } catch {
                        toast.error(
                          'Não foi possível copiar o código',
                          'Tente novamente.',
                        )
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copiar código
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRegenerateDialogOpen(true)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Gerar novo código
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoTile
              icon={UserPlus}
              label="Solicitações pendentes"
              value={String(pendingCount)}
            />
            <InfoTile
              icon={UsersRound}
              label="Profissionais autorizados"
              value={String(activeProfessionals.length)}
            />
            <InfoTile
              icon={ShieldCheck}
              label="Compartilhamento clínico"
              value={globalSharingEnabled ? 'Ativo' : 'Pausado'}
            />
            {!globalSharingEnabled ? (
              <p className="rounded-[1rem] border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900">
                O compartilhamento clínico geral está desativado no momento. Mesmo com vínculos ativos, o acesso fica pausado até você reativá-lo em Configurações.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações pendentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          ) : requestsQuery.isError ? (
            <div className="rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-5">
              <p className="text-sm font-semibold text-foreground">
                Não foi possível carregar suas solicitações agora.
              </p>
            </div>
          ) : requestsQuery.data?.items.length ? (
            requestsQuery.data.items.map((request) => {
              const details = formatProfessionalSummary(request.doctor)

              return (
                <div
                  key={request.id}
                  className="rounded-[1.3rem] border border-white/80 bg-white/84 px-5 py-5 shadow-soft"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {request.doctor.fullName}
                        </h3>
                        <Badge variant="warning">Solicitação pendente</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {details.specialty}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {details.council}
                      </p>
                      {details.clinic ? (
                        <p className="text-sm text-muted-foreground">
                          {details.clinic}
                        </p>
                      ) : null}
                      <p className="text-sm text-muted-foreground">
                        Solicitado em {formatDate(request.requestedAt)}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Este profissional deseja acompanhar seus registros no FibroSync.
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Ao aceitar, ele poderá visualizar as informações disponibilizadas para profissionais vinculados.
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Você poderá remover esse acesso posteriormente.
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
                      <Button
                        type="button"
                        className="w-full lg:w-40"
                        onClick={() => acceptMutation.mutate(request.id)}
                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                      >
                        Aceitar
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full lg:w-40"
                        onClick={() => rejectMutation.mutate(request.id)}
                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                      >
                        Recusar
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-5">
              <p className="text-sm leading-6 text-muted-foreground">
                Nenhuma solicitação pendente no momento.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profissionais autorizados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {professionalsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : professionalsQuery.isError ? (
            <div className="rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-5">
              <p className="text-sm font-semibold text-foreground">
                Não foi possível carregar os profissionais autorizados agora.
              </p>
            </div>
          ) : activeProfessionals.length ? (
            activeProfessionals.map((item) => {
              const details = formatProfessionalSummary(item.doctor)
              const isExpanded = expandedProfessionalId === item.id

              return (
                <div
                  key={item.id}
                  className="rounded-[1.3rem] border border-white/80 bg-white/84 px-5 py-5 shadow-soft"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {item.doctor.fullName}
                        </h3>
                        <Badge variant="success">Autorizado</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {details.specialty}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Acesso autorizado desde {formatDate(item.authorizedAt)}.
                      </p>

                      {isExpanded ? (
                        <div className="space-y-2 rounded-[1rem] border border-white/75 bg-white/82 px-4 py-4">
                          <p className="text-sm text-muted-foreground">
                            {details.council}
                          </p>
                          {details.clinic ? (
                            <p className="text-sm text-muted-foreground">
                              {details.clinic}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full lg:w-40"
                        onClick={() =>
                          setExpandedProfessionalId((current) =>
                            current === item.id ? null : item.id,
                          )
                        }
                      >
                        Ver detalhes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full lg:w-40"
                        onClick={() => setAccessIdToRemove(item.id)}
                      >
                        Remover acesso
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-5">
              <p className="text-sm leading-6 text-muted-foreground">
                Você ainda não autorizou nenhum profissional.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isRegenerateDialogOpen}
        onOpenChange={setIsRegenerateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar um novo código?</DialogTitle>
            <DialogDescription>
              O código atual deixará de funcionar para novas solicitações.
              Profissionais que você já autorizou continuarão com acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRegenerateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
            >
              {regenerateMutation.isPending ? 'Gerando...' : 'Gerar novo código'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(accessIdToRemove)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setAccessIdToRemove(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover acesso deste profissional?</DialogTitle>
            <DialogDescription>
              Ele não poderá mais visualizar seus registros no FibroSync.
            </DialogDescription>
          </DialogHeader>
          {professionalToRemove ? (
            <div className="mt-4 rounded-[1rem] border border-white/80 bg-white/82 px-4 py-4">
              <p className="text-sm font-semibold text-foreground">
                {professionalToRemove.doctor.fullName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatProfessionalSummary(professionalToRemove.doctor).specialty}
              </p>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAccessIdToRemove(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!accessIdToRemove) {
                  return
                }

                revokeMutation.mutate(accessIdToRemove)
              }}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? 'Removendo...' : 'Remover acesso'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Stethoscope
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1rem] border border-white/80 bg-white/82 px-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <p className="text-xs uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}
