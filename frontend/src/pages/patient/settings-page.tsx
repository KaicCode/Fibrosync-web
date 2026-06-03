import { useCallback, useMemo, useState } from 'react'
import type { ReactNode, SetStateAction } from 'react'
import {
  AlertCircle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mail,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNotifications } from '@/hooks/useNotifications'
import { usePageTitle } from '@/hooks/use-page-title'
import { useUser } from '@/hooks/useUser'
import { useUserSettings } from '@/hooks/useUserSettings'
import { ApiError } from '@/lib/api-client'
import type { UserSettings } from '@/services/user-settings.service'
import type { UserProfile } from '@/services/user.service'

type AccountFormState = {
  fullName: string
  birthDate: string
  gender: string
  heightCm: string
  weightKg: string
  countryCode: string
  timezone: string
  onboardingCompleted: boolean
}

type PreferenceFormState = {
  dailySummaryEnabled: boolean
  dailySummaryTime: string
  endOfDayReminderEnabled: boolean
  endOfDayReminderTime: string
  smartSearchEnabled: boolean
  calendarInsightsEnabled: boolean
  inAppNotificationsEnabled: boolean
  emailNotificationsEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  clinicalDataSharingEnabled: boolean
  reportExportConfirmationEnabled: boolean
  deviceProtectionEnabled: boolean
  permissionReviewEnabled: boolean
}

type SaveState =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

const countryOptions = [
  { value: '', label: 'Não informar' },
  { value: 'BR', label: 'Brasil' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'PT', label: 'Portugal' },
]

function toDateInputValue(value?: string | null): string {
  return value?.split('T')[0] ?? ''
}

function toNumberInputValue(value?: number | null): string {
  return value === null || value === undefined ? '' : String(value)
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

function parseOptionalNumber(value: string): number | null {
  const normalized = value.trim().replace(',', '.')

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function buildAccountFormState(user: UserProfile | null | undefined): AccountFormState {
  return {
    fullName: user?.fullName ?? '',
    birthDate: toDateInputValue(user?.birthDate),
    gender: user?.gender ?? '',
    heightCm: toNumberInputValue(user?.heightCm),
    weightKg: toNumberInputValue(user?.weightKg),
    countryCode: user?.countryCode ?? '',
    timezone: user?.timezone || 'America/Sao_Paulo',
    onboardingCompleted: user?.onboardingCompleted ?? false,
  }
}

function buildPreferenceFormState(
  settings: UserSettings | null | undefined,
): PreferenceFormState {
  return {
    dailySummaryEnabled: settings?.dailySummaryEnabled ?? true,
    dailySummaryTime: settings?.dailySummaryTime ?? '08:00',
    endOfDayReminderEnabled: settings?.endOfDayReminderEnabled ?? true,
    endOfDayReminderTime: settings?.endOfDayReminderTime ?? '20:00',
    smartSearchEnabled: settings?.smartSearchEnabled ?? true,
    calendarInsightsEnabled: settings?.calendarInsightsEnabled ?? true,
    inAppNotificationsEnabled: settings?.inAppNotificationsEnabled ?? true,
    emailNotificationsEnabled: settings?.emailNotificationsEnabled ?? false,
    quietHoursEnabled: settings?.quietHoursEnabled ?? false,
    quietHoursStart: settings?.quietHoursStart ?? '22:00',
    quietHoursEnd: settings?.quietHoursEnd ?? '06:30',
    clinicalDataSharingEnabled: settings?.clinicalDataSharingEnabled ?? false,
    reportExportConfirmationEnabled:
      settings?.reportExportConfirmationEnabled ?? true,
    deviceProtectionEnabled: settings?.deviceProtectionEnabled ?? true,
    permissionReviewEnabled: settings?.permissionReviewEnabled ?? true,
  }
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="space-y-2">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </label>
  )
}

function ToggleItem({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-white/80 bg-white/86 px-4 py-3.5 shadow-soft">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-border"
      />
    </label>
  )
}

export function SettingsPage() {
  usePageTitle('Configurações')

  const { user, isLoading: isLoadingUser, updateProfile, isUpdating: isUpdatingProfile } = useUser()
  const {
    settings,
    isLoading: isLoadingSettings,
    updateSettings,
    isUpdating: isUpdatingSettings,
  } = useUserSettings()
  const {
    notifications,
    isLoading: isLoadingNotifications,
    markAsRead,
    isMarkingAsRead,
    unreadCount,
  } = useNotifications({ limit: 5 })

  const [accountDraft, setAccountDraftState] = useState<AccountFormState | null>(null)
  const [preferencesDraft, setPreferencesDraftState] =
    useState<PreferenceFormState | null>(null)
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' })

  const accountForm = useMemo(
    () => accountDraft ?? buildAccountFormState(user),
    [accountDraft, user],
  )
  const preferencesForm = useMemo(
    () => preferencesDraft ?? buildPreferenceFormState(settings),
    [preferencesDraft, settings],
  )

  const setAccountForm = useCallback(
    (next: SetStateAction<AccountFormState>) => {
      setAccountDraftState((currentDraft) => {
        const currentState = currentDraft ?? buildAccountFormState(user)

        return typeof next === 'function'
          ? next(currentState)
          : next
      })
    },
    [user],
  )

  const setPreferencesForm = useCallback(
    (next: SetStateAction<PreferenceFormState>) => {
      setPreferencesDraftState((currentDraft) => {
        const currentState =
          currentDraft ?? buildPreferenceFormState(settings)

        return typeof next === 'function'
          ? next(currentState)
          : next
      })
    },
    [settings],
  )

  const protectionScore = useMemo(() => {
    const protections = [
      preferencesForm.clinicalDataSharingEnabled,
      preferencesForm.reportExportConfirmationEnabled,
      preferencesForm.deviceProtectionEnabled,
      preferencesForm.permissionReviewEnabled,
    ]

    return protections.filter(Boolean).length
  }, [preferencesForm])

  const recentUnreadNotifications = notifications.filter((notification) => !notification.read).length
  const isLoading = isLoadingUser || isLoadingSettings
  const isSaving = isUpdatingProfile || isUpdatingSettings

  async function handleSaveAll() {
    if (preferencesForm.quietHoursEnabled) {
      if (!preferencesForm.quietHoursStart || !preferencesForm.quietHoursEnd) {
        setSaveState({
          kind: 'error',
          message: 'Defina início e fim do horário silencioso antes de salvar.',
        })
        return
      }
    }

    try {
      await Promise.all([
        updateProfile({
          fullName: accountForm.fullName.trim(),
          birthDate: accountForm.birthDate || null,
          gender: accountForm.gender.trim() || null,
          heightCm: parseOptionalNumber(accountForm.heightCm),
          weightKg: parseOptionalNumber(accountForm.weightKg),
          countryCode: accountForm.countryCode || null,
          timezone: accountForm.timezone.trim(),
          onboardingCompleted: accountForm.onboardingCompleted,
        }),
        updateSettings({
          dailySummaryEnabled: preferencesForm.dailySummaryEnabled,
          dailySummaryTime: preferencesForm.dailySummaryTime,
          endOfDayReminderEnabled: preferencesForm.endOfDayReminderEnabled,
          endOfDayReminderTime: preferencesForm.endOfDayReminderTime,
          smartSearchEnabled: preferencesForm.smartSearchEnabled,
          calendarInsightsEnabled: preferencesForm.calendarInsightsEnabled,
          inAppNotificationsEnabled: preferencesForm.inAppNotificationsEnabled,
          emailNotificationsEnabled: preferencesForm.emailNotificationsEnabled,
          quietHoursEnabled: preferencesForm.quietHoursEnabled,
          quietHoursStart: preferencesForm.quietHoursEnabled
            ? preferencesForm.quietHoursStart
            : null,
          quietHoursEnd: preferencesForm.quietHoursEnabled
            ? preferencesForm.quietHoursEnd
            : null,
          clinicalDataSharingEnabled: preferencesForm.clinicalDataSharingEnabled,
          reportExportConfirmationEnabled:
            preferencesForm.reportExportConfirmationEnabled,
          deviceProtectionEnabled: preferencesForm.deviceProtectionEnabled,
          permissionReviewEnabled: preferencesForm.permissionReviewEnabled,
        }),
      ])

      setAccountDraftState(null)
      setPreferencesDraftState(null)

      setSaveState({
        kind: 'success',
        message: 'Suas configurações foram salvas e sincronizadas com a conta.',
      })
    } catch (error) {
      setSaveState({
        kind: 'error',
        message:
          error instanceof ApiError
            ? error.message
            : 'Nao foi possível salvar as configurações agora.',
      })
    }
  }

  async function handleReadNotification(notificationId: string) {
    try {
      await markAsRead(notificationId)
    } catch (error) {
      setSaveState({
        kind: 'error',
        message:
          error instanceof ApiError
            ? error.message
            : 'Nao foi possível atualizar a notificação.',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Preferências do workspace"
        title="Configurações prontas para o uso real da conta"
        description="Edite seus dados, ajuste rotina, privacidade e lembretes em uma central persistida no banco de dados."
        actions={
          <Button onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar configurações
              </>
            )}
          </Button>
        }
      />

      {saveState.kind !== 'idle' ? (
        <div
          className={`flex items-start gap-3 rounded-[1.3rem] border px-4 py-3.5 ${
            saveState.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50/90 text-emerald-700'
              : 'border-rose-200 bg-rose-50/90 text-rose-700'
          }`}
        >
          {saveState.kind === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <p className="text-sm leading-6">{saveState.message}</p>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3">
        <StatCard
          label="Resumo diário"
          value={preferencesForm.dailySummaryEnabled ? preferencesForm.dailySummaryTime : 'Desativado'}
          hint={
            preferencesForm.dailySummaryEnabled
              ? 'Horário escolhido para o resumo matinal.'
              : 'Resumo diário pausado para esta conta.'
          }
          icon={Sparkles}
          tone="success"
        />
        <StatCard
          label="Lembrete final"
          value={
            preferencesForm.endOfDayReminderEnabled
              ? preferencesForm.endOfDayReminderTime
              : 'Desativado'
          }
          hint={
            preferencesForm.quietHoursEnabled
              ? `Silêncio entre ${preferencesForm.quietHoursStart} e ${preferencesForm.quietHoursEnd}.`
              : 'Sem horário silencioso configurado.'
          }
          icon={Clock3}
          tone="default"
        />
        <StatCard
          label="Proteções ativas"
          value={`${protectionScore}/4`}
          hint={`${recentUnreadNotifications} alerta(s) ainda não lido(s) na conta.`}
          icon={ShieldCheck}
          tone={protectionScore >= 3 ? 'success' : 'warning'}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-5">
          <div className="card-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Conta</p>
                <h2 className="mt-2 text-xl font-semibold md:text-2xl">Dados do perfil</h2>
              </div>
              <Badge variant="neutral">{user?.email ?? 'Conta autenticada'}</Badge>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nome completo">
                <Input
                  value={accountForm.fullName}
                  onChange={(event) =>
                    setAccountForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  placeholder="Seu nome"
                />
              </Field>

              <Field label="E-mail" hint="O e-mail de acesso é apenas visualizado aqui.">
                <Input value={user?.email ?? ''} disabled />
              </Field>

              <Field label="Nascimento">
                <Input
                  type="date"
                  value={accountForm.birthDate}
                  onChange={(event) =>
                    setAccountForm((current) => ({ ...current, birthDate: event.target.value }))
                  }
                />
              </Field>

              <Field label="Gênero">
                <Input
                  value={accountForm.gender}
                  onChange={(event) =>
                    setAccountForm((current) => ({ ...current, gender: event.target.value }))
                  }
                  placeholder="Ex.: Feminino"
                />
              </Field>

              <Field label="Altura (cm)">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={accountForm.heightCm}
                  onChange={(event) =>
                    setAccountForm((current) => ({ ...current, heightCm: event.target.value }))
                  }
                  placeholder="170"
                />
              </Field>

              <Field label="Peso (kg)">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={accountForm.weightKg}
                  onChange={(event) =>
                    setAccountForm((current) => ({ ...current, weightKg: event.target.value }))
                  }
                  placeholder="65"
                />
              </Field>

              <Field label="País">
                <select
                  value={accountForm.countryCode}
                  onChange={(event) =>
                    setAccountForm((current) => ({
                      ...current,
                      countryCode: event.target.value.toUpperCase(),
                    }))
                  }
                  className="flex h-11 w-full rounded-xl border border-input bg-white/80 px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition-all focus:border-brand-300 focus:ring-4 focus:ring-brand-100/60"
                >
                  {countryOptions.map((option) => (
                    <option key={option.value || 'empty'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fuso horário">
                <Input
                  value={accountForm.timezone}
                  onChange={(event) =>
                    setAccountForm((current) => ({ ...current, timezone: event.target.value }))
                  }
                  placeholder="America/Sao_Paulo"
                />
              </Field>
            </div>

            <div className="mt-5">
              <ToggleItem
                title="Onboarding concluído"
                description="Marque se você já finalizou a configuração inicial da experiência."
                checked={accountForm.onboardingCompleted}
                onChange={(checked) =>
                  setAccountForm((current) => ({ ...current, onboardingCompleted: checked }))
                }
              />
            </div>
          </div>

          <div className="card-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Rotina inteligente</p>
                <h2 className="mt-2 text-xl font-semibold md:text-2xl">Alertas e experiência</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                <CalendarClock className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <ToggleItem
                title="Resumo diário"
                description="Mantém ativo o resumo de contexto para começar o dia com mais clareza."
                checked={preferencesForm.dailySummaryEnabled}
                onChange={(checked) =>
                  setPreferencesForm((current) => ({ ...current, dailySummaryEnabled: checked }))
                }
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Horário do resumo">
                  <Input
                    type="time"
                    value={preferencesForm.dailySummaryTime}
                    onChange={(event) =>
                      setPreferencesForm((current) => ({
                        ...current,
                        dailySummaryTime: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Horário do lembrete final">
                  <Input
                    type="time"
                    value={preferencesForm.endOfDayReminderTime}
                    onChange={(event) =>
                      setPreferencesForm((current) => ({
                        ...current,
                        endOfDayReminderTime: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>

              <ToggleItem
                title="Lembrete no fim do dia"
                description="Ajuda a não esquecer o registro de sintomas e dores do período."
                checked={preferencesForm.endOfDayReminderEnabled}
                onChange={(checked) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    endOfDayReminderEnabled: checked,
                  }))
                }
              />

              <ToggleItem
                title="Busca inteligente"
                description="Prioriza resultados recentes e contexto pessoal nas buscas do workspace."
                checked={preferencesForm.smartSearchEnabled}
                onChange={(checked) =>
                  setPreferencesForm((current) => ({ ...current, smartSearchEnabled: checked }))
                }
              />

              <ToggleItem
                title="Sugestões no calendário"
                description="Mantém ativa a leitura de padrões para apoiar a rotina no calendário."
                checked={preferencesForm.calendarInsightsEnabled}
                onChange={(checked) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    calendarInsightsEnabled: checked,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Notificações e privacidade</p>
                <h2 className="mt-2 text-xl font-semibold md:text-2xl">Controle do workspace</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <BellRing className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <ToggleItem
                title="Notificações no app"
                description="Mantém alertas internos e avisos importantes disponíveis na conta."
                checked={preferencesForm.inAppNotificationsEnabled}
                onChange={(checked) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    inAppNotificationsEnabled: checked,
                  }))
                }
              />

              <ToggleItem
                title="Notificações por e-mail"
                description="Permite receber comunicações complementares fora da plataforma."
                checked={preferencesForm.emailNotificationsEnabled}
                onChange={(checked) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    emailNotificationsEnabled: checked,
                  }))
                }
              />

              <ToggleItem
                title="Horário silencioso"
                description="Evita interrupções fora do período desejado para descanso e foco."
                checked={preferencesForm.quietHoursEnabled}
                onChange={(checked) =>
                  setPreferencesForm((current) => ({ ...current, quietHoursEnabled: checked }))
                }
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Início do silêncio">
                  <Input
                    type="time"
                    value={preferencesForm.quietHoursStart}
                    disabled={!preferencesForm.quietHoursEnabled}
                    onChange={(event) =>
                      setPreferencesForm((current) => ({
                        ...current,
                        quietHoursStart: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Fim do silêncio">
                  <Input
                    type="time"
                    value={preferencesForm.quietHoursEnd}
                    disabled={!preferencesForm.quietHoursEnabled}
                    onChange={(event) =>
                      setPreferencesForm((current) => ({
                        ...current,
                        quietHoursEnd: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>

              <ToggleItem
                title="Compartilhamento clínico controlado"
                description="Guarda sua preferência de compartilhamento de dados em sessões clínicas."
                checked={preferencesForm.clinicalDataSharingEnabled}
                onChange={(checked) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    clinicalDataSharingEnabled: checked,
                  }))
                }
              />

              <ToggleItem
                title="Confirmar exportação de relatórios"
                description="Exige confirmação antes de liberar relatórios para exportação."
                checked={preferencesForm.reportExportConfirmationEnabled}
                onChange={(checked) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    reportExportConfirmationEnabled: checked,
                  }))
                }
              />

              <ToggleItem
                title="Proteção reforçada em dispositivos"
                description="Mantém a conta marcada para camadas extras de proteção local."
                checked={preferencesForm.deviceProtectionEnabled}
                onChange={(checked) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    deviceProtectionEnabled: checked,
                  }))
                }
              />

              <ToggleItem
                title="Revisão periódica de permissões"
                description="Registra sua preferência para revisão recorrente de acessos sensíveis."
                checked={preferencesForm.permissionReviewEnabled}
                onChange={(checked) =>
                  setPreferencesForm((current) => ({
                    ...current,
                    permissionReviewEnabled: checked,
                  }))
                }
              />
            </div>
          </div>

          <div className="card-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Alertas recentes</p>
                <h2 className="mt-2 text-xl font-semibold md:text-2xl">Notificações da conta</h2>
              </div>
              <Badge variant={unreadCount > 0 ? 'warning' : 'success'}>
                {unreadCount > 0 ? `${unreadCount} pendente(s)` : 'Tudo lido'}
              </Badge>
            </div>

            <div className="mt-5 space-y-3">
              {isLoadingNotifications ? (
                <div className="flex min-h-[10rem] items-center justify-center">
                  <LoaderCircle className="h-6 w-6 animate-spin text-brand-500" />
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-[1.25rem] border border-white/80 bg-white/86 px-4 py-3.5 shadow-soft"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {notification.title}
                          </p>
                          <Badge variant={notification.read ? 'neutral' : 'warning'}>
                            {notification.read ? 'Lida' : 'Nova'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{formatDateTime(notification.createdAt)}</span>
                          <span>•</span>
                          <span>{notification.channel}</span>
                        </div>
                      </div>

                      {!notification.read ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReadNotification(notification.id)}
                          disabled={isMarkingAsRead}
                        >
                          Marcar como lida
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-white/80 bg-white/86 px-4 py-5 text-sm leading-6 text-muted-foreground shadow-soft">
                  Nenhuma notificação registrada ainda. Quando o sistema gerar alertas de risco ou lembretes, eles aparecerão aqui.
                </div>
              )}
            </div>
          </div>

          <div className="card-surface p-5">
            <p className="section-label">Status da conta</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1.2rem] bg-brand-50/55 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-brand-600" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Último login</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateTime(user?.lastLoginAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.2rem] bg-white/86 px-4 py-3.5 shadow-soft">
                <div className="flex items-center gap-3">
                  <Search className="h-4 w-4 text-brand-600" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Busca inteligente</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {preferencesForm.smartSearchEnabled
                        ? 'Ativa para consultas no workspace.'
                        : 'Pausada para esta conta.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
