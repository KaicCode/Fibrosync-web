import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Bot,
  Clock3,
  Info,
  Loader,
  Mail,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  Smartphone,
} from 'lucide-react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'
import { AdminContentSection } from '@/components/admin/cards/content-section'
import { PageHeader } from '@/components/page-header'
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
import { usePageTitle } from '@/hooks/use-page-title'
import { adminService } from '@/services/admin.service'
import { toast } from '@/store/toast-store'
import type {
  AdminSystemSettingsAuditItem,
  AdminSystemSettingsDefaults,
  AdminSystemSettingsSummary,
} from '@/types/admin'

type SettingsFormState = {
  aiEnabled: boolean
  inAppNotificationsEnabled: boolean
  symptomNotificationsEnabled: boolean
  attentionModerateThreshold: string
  attentionHighThreshold: string
  attentionCriticalThreshold: string
}

type ConfirmAction = 'save' | 'reset' | null

function buildFormState(
  input:
    | AdminSystemSettingsSummary['settings']
    | AdminSystemSettingsDefaults
    | null
    | undefined,
): SettingsFormState | null {
  if (!input) {
    return null
  }

  return {
    aiEnabled: input.aiEnabled,
    inAppNotificationsEnabled: input.inAppNotificationsEnabled,
    symptomNotificationsEnabled: input.symptomNotificationsEnabled,
    attentionModerateThreshold: String(input.attentionModerateThreshold),
    attentionHighThreshold: String(input.attentionHighThreshold),
    attentionCriticalThreshold: String(input.attentionCriticalThreshold),
  }
}

function parseThreshold(value: string): number | null {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed)) {
    return null
  }

  return parsed
}

function validateFormState(form: SettingsFormState | null): string | null {
  if (!form) {
    return 'As configuracoes ainda nao estao prontas para edicao.'
  }

  const moderate = parseThreshold(form.attentionModerateThreshold)
  const high = parseThreshold(form.attentionHighThreshold)
  const critical = parseThreshold(form.attentionCriticalThreshold)

  if (moderate === null || high === null || critical === null) {
    return 'Os niveis de atencao devem ser numeros inteiros entre 0 e 100.'
  }

  if ([moderate, high, critical].some((value) => value < 0 || value > 100)) {
    return 'Os niveis de atencao devem ficar entre 0 e 100.'
  }

  if (!(moderate < high && high < critical)) {
    return 'O nivel moderado deve ser menor que o elevado, e o elevado deve ser menor que o critico.'
  }

  return null
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return 'Sem registro'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Tente novamente em alguns instantes.'
}

function ToggleField({
  title,
  description,
  checked,
  disabled = false,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-white/80 bg-white/86 px-4 py-4 shadow-soft">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Badge variant={checked ? 'success' : 'neutral'}>
          {checked ? 'Ativado' : 'Desativado'}
        </Badge>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="h-5 w-5 rounded border-border accent-brand-600"
        />
      </div>
    </label>
  )
}

function NumberField({
  title,
  description,
  value,
  onChange,
}: {
  title: string
  description: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="space-y-2 rounded-[1.25rem] border border-white/80 bg-white/86 px-4 py-4 shadow-soft">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <Input
          type="number"
          min={0}
          max={100}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="max-w-[8rem]"
        />
        <span className="text-sm font-medium text-muted-foreground">0 a 100</span>
      </div>
    </label>
  )
}

function StatusRow({
  icon: Icon,
  title,
  description,
  badge,
  badgeVariant = 'neutral',
}: {
  icon: typeof Info
  title: string
  description: string
  badge: string
  badgeVariant?: 'success' | 'warning' | 'neutral' | 'default'
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-white/80 bg-white/86 px-4 py-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <Badge variant={badgeVariant}>{badge}</Badge>
    </div>
  )
}

function RecentChangeCard({ item }: { item: AdminSystemSettingsAuditItem }) {
  return (
    <article className="rounded-[1.25rem] border border-white/80 bg-white/86 px-4 py-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{item.label}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {item.oldValue ?? 'Sem valor anterior'} → {item.newValue ?? 'Sem novo valor'}
          </p>
        </div>
        <Badge variant="neutral">{formatDateTime(item.changedAt)}</Badge>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Alterado por {item.changedBy?.fullName ?? 'Administrador'}
      </p>
    </article>
  )
}

function PageErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card-surface p-6">
      <div className="rounded-[1.35rem] border border-rose-200 bg-rose-50/90 px-5 py-5">
        <p className="text-sm font-semibold text-rose-800">
          Nao foi possivel carregar as configuracoes
        </p>
        <p className="mt-2 text-sm leading-6 text-rose-700">
          Tente novamente para continuar a edicao.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-24 animate-pulse rounded-[1.25rem] bg-slate-100" />
      <div className="h-24 animate-pulse rounded-[1.25rem] bg-slate-100" />
    </div>
  )
}

export function AdminSettingsPage() {
  usePageTitle('Configuracoes do sistema')

  const queryClient = useQueryClient()
  const [draftForm, setDraftForm] = useState<SettingsFormState | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  const settingsQuery = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: () => adminService.getSystemSettings(),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })

  const baselineForm = useMemo(
    () => buildFormState(settingsQuery.data?.settings),
    [settingsQuery.data?.settings],
  )

  const defaultsForm = useMemo(
    () => buildFormState(settingsQuery.data?.defaults),
    [settingsQuery.data?.defaults],
  )

  const form = draftForm ?? baselineForm

  const isDirty =
    Boolean(form) &&
    Boolean(baselineForm) &&
    JSON.stringify(form) !== JSON.stringify(baselineForm)

  const matchesDefaults =
    Boolean(form) &&
    Boolean(defaultsForm) &&
    JSON.stringify(form) === JSON.stringify(defaultsForm)

  const validationMessage = validateFormState(form)
  const blocker = useBlocker(Boolean(isDirty))
  const leaveDialogOpen = blocker.state === 'blocked'

  useBeforeUnload(
    (event) => {
      if (!isDirty) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    },
    { capture: true },
  )

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!form || !settingsQuery.data) {
        throw new Error('As configuracoes ainda nao foram carregadas.')
      }

      const moderate = parseThreshold(form.attentionModerateThreshold)
      const high = parseThreshold(form.attentionHighThreshold)
      const critical = parseThreshold(form.attentionCriticalThreshold)

      if (moderate === null || high === null || critical === null) {
        throw new Error('Os niveis de atencao devem ser numeros inteiros entre 0 e 100.')
      }

      return adminService.updateSystemSettings({
        expectedUpdatedAt: settingsQuery.data.settings.updatedAt,
        aiEnabled: form.aiEnabled,
        inAppNotificationsEnabled: form.inAppNotificationsEnabled,
        symptomNotificationsEnabled: form.symptomNotificationsEnabled,
        attentionModerateThreshold: moderate,
        attentionHighThreshold: high,
        attentionCriticalThreshold: critical,
      })
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['admin-system-settings'], result)
      setDraftForm(null)
      setConfirmAction(null)
      toast.success(
        'Configuracoes atualizadas',
        'As novas regras ja estao disponiveis para as proximas analises e notificacoes.',
      )
    },
    onError: (error) => {
      toast.error(
        'Nao foi possivel salvar',
        `Nenhuma alteracao foi aplicada. ${resolveErrorMessage(error)}`,
      )
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => {
      if (!settingsQuery.data) {
        throw new Error('As configuracoes ainda nao foram carregadas.')
      }

      return adminService.resetSystemSettings({
        expectedUpdatedAt: settingsQuery.data.settings.updatedAt,
      })
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['admin-system-settings'], result)
      setDraftForm(null)
      setConfirmAction(null)
      toast.success(
        'Padroes restaurados',
        'Os valores documentados do sistema foram restaurados com sucesso.',
      )
    },
    onError: (error) => {
      toast.error(
        'Nao foi possivel restaurar',
        `Os valores anteriores foram mantidos. ${resolveErrorMessage(error)}`,
      )
    },
  })

  const isSaving = saveMutation.isPending || resetMutation.isPending

  const handleRetry = () => {
    void settingsQuery.refetch()
  }

  const handleSaveRequest = () => {
    if (validationMessage) {
      toast.error('Valores invalidos', validationMessage)
      return
    }

    setConfirmAction('save')
  }

  const handleResetRequest = () => {
    setConfirmAction('reset')
  }

  const handleConfirmAction = () => {
    if (confirmAction === 'save') {
      saveMutation.mutate()
      return
    }

    if (confirmAction === 'reset') {
      resetMutation.mutate()
    }
  }

  const handleDiscardChanges = () => {
    blocker.proceed?.()
  }

  const handleContinueEditing = () => {
    blocker.reset?.()
  }

  const updateForm = (
    updater: (current: SettingsFormState) => SettingsFormState,
  ) => {
    setDraftForm((current) => {
      const base = current ?? form

      return base ? updater(base) : current
    })
  }

  const settings = settingsQuery.data?.settings
  const capabilities = settingsQuery.data?.capabilities
  const recentChanges = settingsQuery.data?.recentChanges ?? []

  if (settingsQuery.isError && !settingsQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Administrador"
          title="Configuracoes do sistema"
          description="Gerencie recursos, notificacoes e regras operacionais da plataforma."
        />
        <PageErrorState onRetry={handleRetry} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrador"
        title="Configuracoes do sistema"
        description="Gerencie recursos, notificacoes e regras operacionais da plataforma."
        actions={
          <div className="flex flex-col items-stretch gap-3 md:items-end">
            <Badge variant={isDirty ? 'warning' : 'neutral'}>
              {isDirty ? 'Alteracoes nao salvas' : `Atualizado ${formatDateTime(settings?.updatedAt)}`}
            </Badge>
            {settings?.updatedBy ? (
              <p className="text-xs text-muted-foreground">
                Ultima alteracao por {settings.updatedBy.fullName}
              </p>
            ) : null}
          </div>
        }
      />

      <AdminContentSection
        title="Inteligencia e analises"
        description="Controle os recursos automaticos utilizados para analisar padroes dos registros."
        isLoading={settingsQuery.isLoading && !settingsQuery.data}
      >
        {!form || !capabilities ? (
          <SectionSkeleton />
        ) : (
          <div className="space-y-4">
            <ToggleField
              title="Analises com inteligencia artificial"
              description="Permite utilizar inteligencia artificial para complementar a analise dos registros quando o recurso estiver disponivel."
              checked={form.aiEnabled}
              onCheckedChange={(checked) =>
                updateForm((current) => ({
                  ...current,
                  aiEnabled: checked,
                }))
              }
            />

            <StatusRow
              icon={Bot}
              title="Servico de IA"
              description={
                capabilities.aiProviderConfigured
                  ? 'O provider de IA esta configurado. Se a chave global estiver ativada, novas analises podem ser executadas sob demanda.'
                  : 'O provider de IA ainda nao esta configurado. Mesmo com a chave global ativada, nenhuma chamada externa sera executada ate a configuracao segura do ambiente.'
              }
              badge={capabilities.aiProviderConfigured ? 'Configurado' : 'Nao configurado'}
              badgeVariant={capabilities.aiProviderConfigured ? 'success' : 'warning'}
            />

            <StatusRow
              icon={Clock3}
              title="Execucao das analises"
              description="O motor de regras roda apos cada novo registro diario. As analises com IA ficam disponiveis sob demanda quando habilitadas."
              badge="Conforme a arquitetura atual"
            />
          </div>
        )}
      </AdminContentSection>

      <AdminContentSection
        title="Notificacoes"
        description="Defina quais tipos de avisos podem ser enviados pela plataforma."
        isLoading={settingsQuery.isLoading && !settingsQuery.data}
      >
        {!form || !capabilities ? (
          <SectionSkeleton />
        ) : (
          <div className="space-y-4">
            <ToggleField
              title="Avisos no FibroSync"
              description="Controla a geracao e a exibicao dos avisos internos na aplicacao, respeitando tambem a preferencia individual do paciente."
              checked={form.inAppNotificationsEnabled}
              onCheckedChange={(checked) =>
                updateForm((current) => ({
                  ...current,
                  inAppNotificationsEnabled: checked,
                }))
              }
            />

            <ToggleField
              title="Informacoes sobre sintomas"
              description="Permite gerar avisos internos baseados nas analises dos registros quando o canal no aplicativo estiver habilitado."
              checked={form.symptomNotificationsEnabled}
              onCheckedChange={(checked) =>
                updateForm((current) => ({
                  ...current,
                  symptomNotificationsEnabled: checked,
                }))
              }
            />

            <StatusRow
              icon={Mail}
              title="E-mail"
              description="Ainda nao existe infraestrutura real de envio de e-mail nesta versao. Por isso, este canal nao aparece como configuracao ativa."
              badge={capabilities.emailNotificationsAvailable ? 'Disponivel' : 'Ainda nao configurado'}
              badgeVariant={capabilities.emailNotificationsAvailable ? 'success' : 'warning'}
            />

            <StatusRow
              icon={Smartphone}
              title="SMS"
              description="Nao existe provider real de SMS configurado no backend atual. O canal foi mantido apenas como status informativo."
              badge={capabilities.smsNotificationsAvailable ? 'Disponivel' : 'Indisponivel'}
              badgeVariant={capabilities.smsNotificationsAvailable ? 'success' : 'neutral'}
            />
          </div>
        )}
      </AdminContentSection>

      <AdminContentSection
        title="Regras de atencao"
        description="Defina como o sistema classifica os niveis calculados pelo motor de regras."
        isLoading={settingsQuery.isLoading && !settingsQuery.data}
      >
        {!form ? (
          <SectionSkeleton />
        ) : (
          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-brand-100 bg-brand-50/75 px-4 py-4 text-sm text-brand-900">
              Os valores abaixo representam scores internos de 0 a 100 utilizados pelo motor de regras. Eles nao representam probabilidade clinica validada.
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <NumberField
                title="Atencao moderada"
                description="A partir deste score, o sistema passa a classificar o registro como moderado."
                value={form.attentionModerateThreshold}
                onChange={(value) =>
                  updateForm((current) => ({
                    ...current,
                    attentionModerateThreshold: value,
                  }))
                }
              />

              <NumberField
                title="Atencao elevada"
                description="A partir deste score, o sistema passa a classificar o registro como elevado."
                value={form.attentionHighThreshold}
                onChange={(value) =>
                  updateForm((current) => ({
                    ...current,
                    attentionHighThreshold: value,
                  }))
                }
              />

              <NumberField
                title="Atencao critica"
                description="A partir deste score, o sistema passa a classificar o registro como critico."
                value={form.attentionCriticalThreshold}
                onChange={(value) =>
                  updateForm((current) => ({
                    ...current,
                    attentionCriticalThreshold: value,
                  }))
                }
              />
            </div>

            {validationMessage ? (
              <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50/85 px-4 py-4 text-sm text-amber-800">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{validationMessage}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </AdminContentSection>

      <AdminContentSection
        title="Sistema e execucao"
        description="Mostra a arquitetura operacional real utilizada nesta versao da plataforma."
        isLoading={settingsQuery.isLoading && !settingsQuery.data}
      >
        {!capabilities ? (
          <SectionSkeleton />
        ) : (
          <div className="space-y-4">
            <StatusRow
              icon={RefreshCw}
              title="Motor de regras"
              description="As classificacoes sao atualizadas apos cada novo registro diario e tambem quando uma previsao e recalculada."
              badge="Ativo"
              badgeVariant="success"
            />

            <StatusRow
              icon={Clock3}
              title="Agendamento automatico"
              description="Nao existe scheduler ou worker recorrente configurado para executar verificacoes periodicas nesta versao web."
              badge={capabilities.schedulerAvailable ? 'Disponivel' : 'Indisponivel'}
              badgeVariant={capabilities.schedulerAvailable ? 'success' : 'neutral'}
            />

            <StatusRow
              icon={MessageSquareText}
              title="Canal principal"
              description="Os avisos funcionais da plataforma hoje sao exibidos dentro do proprio FibroSync, respeitando a regra global e a preferencia individual do paciente."
              badge="No aplicativo"
              badgeVariant="success"
            />
          </div>
        )}
      </AdminContentSection>

      <AdminContentSection
        title="Alteracoes recentes"
        description="Historico das ultimas configuracoes alteradas por administradores."
        isLoading={settingsQuery.isLoading && !settingsQuery.data}
      >
        {recentChanges.length > 0 ? (
          <div className="space-y-3">
            {recentChanges.map((item) => (
              <RecentChangeCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">
              Nenhuma alteracao registrada ainda
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Assim que um administrador atualizar as configuracoes globais, o historico aparecera aqui.
            </p>
          </div>
        )}
      </AdminContentSection>

      <div className="flex flex-col gap-3 rounded-[1.35rem] border border-white/80 bg-white/86 p-4 shadow-soft md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Salvar alteracoes</p>
          <p className="text-sm leading-6 text-muted-foreground">
            As novas configuracoes passam a valer nas proximas execucoes do motor de regras, das analises com IA e dos avisos internos.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={handleResetRequest}
            disabled={!settingsQuery.data || matchesDefaults || isSaving}
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar padroes
          </Button>
          <Button
            type="button"
            onClick={handleSaveRequest}
            disabled={!isDirty || Boolean(validationMessage) || isSaving}
          >
            {isSaving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Salvando...' : 'Salvar alteracoes'}
          </Button>
        </div>
      </div>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!isSaving) {
            setConfirmAction(open ? confirmAction : null)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmar alteracao</DialogTitle>
            <DialogDescription>
              Essa mudanca afeta o comportamento do sistema para todos os usuarios.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-700">
            {confirmAction === 'save'
              ? 'As novas configuracoes vao passar a ser usadas nas proximas analises, classificacoes e avisos internos.'
              : 'Os valores documentados como padrao serao restaurados e voltarao a valer para todo o sistema.'}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmAction(null)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmAction} disabled={isSaving}>
              {isSaving ? <Loader className="h-4 w-4 animate-spin" /> : null}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={leaveDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleContinueEditing()
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alteracoes nao salvas</DialogTitle>
            <DialogDescription>
              Voce possui configuracoes que ainda nao foram salvas.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-[1.1rem] border border-amber-100 bg-amber-50/85 px-4 py-4 text-sm text-amber-800">
            Se voce sair agora, as alteracoes desta pagina serao descartadas.
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleContinueEditing}>
              Continuar editando
            </Button>
            <Button type="button" onClick={handleDiscardChanges}>
              Descartar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {settingsQuery.isFetching && settingsQuery.data ? (
        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            Atualizando configuracoes...
          </div>
        </div>
      ) : null}

      {settingsQuery.isError && settingsQuery.data ? (
        <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50/85 px-4 py-4 text-sm text-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Houve uma falha ao atualizar os dados, mas a ultima versao carregada continua disponivel para consulta.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
