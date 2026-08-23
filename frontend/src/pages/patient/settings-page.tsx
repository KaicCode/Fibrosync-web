import { useCallback, useMemo, useState } from 'react'
import type { ReactNode, SetStateAction } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BellRing,
  CalendarClock,
  Clock3,
  LoaderCircle,
  Save,
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
import {
  formatDateTimeWithAtValue,
  resolveTimezoneLabel,
} from '@/lib/user-profile'
import { isQuietHoursRangeValid } from '@/lib/notification-preferences'
import type { Notification } from '@/services/notification.service'
import type { UserSettings } from '@/services/user-settings.service'
import type { UserProfile } from '@/services/user.service'
import { toast } from '@/store/toast-store'

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

const countryOptions = [
  { value: '', label: 'Não informar' },
  { value: 'BR', label: 'Brasil' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'PT', label: 'Portugal' },
]

const timezoneOptions = [
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'America/Recife', label: 'Recife' },
  { value: 'America/Fortaleza', label: 'Fortaleza' },
  { value: 'America/Manaus', label: 'Manaus' },
  { value: 'America/Noronha', label: 'Fernando de Noronha' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
  { value: 'America/Santiago', label: 'Santiago' },
  { value: 'America/New_York', label: 'Nova York' },
  { value: 'Europe/Lisbon', label: 'Lisboa' },
]

function toDateInputValue(value?: string | null): string {
  return value?.split('T')[0] ?? ''
}

function toNumberInputValue(value?: number | null): string {
  return value === null || value === undefined ? '' : String(value)
}

function parseOptionalNumber(value: string): number | null {
  const normalized = value.trim().replace(',', '.')

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function formatNotificationChannel(channel: string): string {
  const normalized = normalizeText(channel)

  if (normalized === 'in_app') {
    return 'No aplicativo'
  }

  if (normalized === 'email') {
    return 'E-mail'
  }

  return channel
}

function formatNotificationTitle(title: string): string {
  const normalized = normalizeText(title)

  if (normalized.includes('possivel crise detectada')) {
    return 'Seus sintomas merecem atenção'
  }

  return title
}

function formatNotificationMessage(message: string): string {
  const normalized = normalizeText(message)
  const factorMatch =
    message.match(/Os fatores mais relevantes foram (.*?)(?:\.|$)/i) ??
    message.match(/Os padrões mais marcantes foram (.*?)(?:\.|$)/i)
  const factorsText = factorMatch?.[1]?.trim()

  if (
    normalized.includes('risco elevado de piora nas proximas horas') ||
    normalized.includes('risco esta muito elevado neste momento') ||
    normalized.includes('sinais iniciais de possivel piora') ||
    normalized.includes('analise inteligente detectou um padrao forte de crise iminente') ||
    normalized.includes('analise inteligente detectou um padrao de risco importante') ||
    normalized.includes('analise inteligente detectou sinais preventivos de piora')
  ) {
    return [
      'Seus registros recentes mostram sinais que podem indicar um período de maior atenção aos sintomas.',
      factorsText
        ? `Alguns fatores que se destacaram foram ${factorsText}.`
        : null,
      'Observe como você está se sentindo, respeite seus limites e mantenha seus registros atualizados.',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return message.replace(
    'Queda de pressão atmosférica pode aumentar sensibilidade à dor.',
    'Mudanças na pressão atmosférica podem estar associadas a maior sensibilidade à dor em algumas pessoas.',
  )
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
        className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-brand-600"
      />
    </label>
  )
}

function SettingsSection({
  eyebrow,
  title,
  icon: Icon,
  children,
}: {
  eyebrow: string
  title: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold md:text-2xl">{title}</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  )
}

function NotificationCard({
  notification,
  onRead,
  disabled,
}: {
  notification: Notification
  onRead: (notificationId: string) => void
  disabled: boolean
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/80 bg-white/86 px-4 py-3.5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {formatNotificationTitle(notification.title)}
            </p>
            <Badge variant={notification.read ? 'neutral' : 'warning'}>
              {notification.read ? 'Lido' : 'Novo'}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {formatNotificationMessage(notification.message)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{formatDateTimeWithAtValue(notification.createdAt)}</span>
            <span>•</span>
            <span>{formatNotificationChannel(notification.channel)}</span>
          </div>
        </div>

        {!notification.read ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRead(notification.id)}
            disabled={disabled}
          >
            Marcar como lido
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function InlineInfo({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="rounded-[1.1rem] border border-violet-100 bg-violet-50/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
      {children}
    </div>
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

  const accountForm = useMemo(
    () => accountDraft ?? buildAccountFormState(user),
    [accountDraft, user],
  )
  const preferencesForm = useMemo(
    () => preferencesDraft ?? buildPreferenceFormState(settings),
    [preferencesDraft, settings],
  )

  const timezoneChoices = useMemo(() => {
    if (!accountForm.timezone) {
      return timezoneOptions
    }

    const alreadyIncluded = timezoneOptions.some((option) => option.value === accountForm.timezone)

    if (alreadyIncluded) {
      return timezoneOptions
    }

    return [
      {
        value: accountForm.timezone,
        label: resolveTimezoneLabel(accountForm.timezone),
      },
      ...timezoneOptions,
    ]
  }, [accountForm.timezone])

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

  const protectionSummary = useMemo(() => {
    const remainingProtectionCount = Math.max(0, 4 - protectionScore)

    return {
      value: formatCount(protectionScore, 'proteção ativa', 'proteções ativas'),
      hint:
        remainingProtectionCount === 0
          ? 'As principais proteções da conta estão ativas.'
          : remainingProtectionCount === 1
            ? 'Há 1 proteção que você ainda pode ativar.'
            : `Há ${remainingProtectionCount} proteções que você ainda pode ativar.`,
    }
  }, [protectionScore])

  const reminderHint = preferencesForm.quietHoursEnabled
    ? `Silencioso entre ${preferencesForm.quietHoursStart} e ${preferencesForm.quietHoursEnd}.`
    : 'Ajuda você a lembrar de registrar como se sentiu durante o dia.'
  const notificationBadgeLabel =
    unreadCount > 0 ? formatCount(unreadCount, 'pendente', 'pendentes') : 'Tudo em dia'
  const isLoading = isLoadingUser || isLoadingSettings
  const isSaving = isUpdatingProfile || isUpdatingSettings

  async function handleSaveAll() {
    if (preferencesForm.dailySummaryEnabled && !preferencesForm.dailySummaryTime) {
      toast.error(
        'Nao foi possivel salvar suas configuracoes',
        'Defina o horario do resumo diario antes de salvar.',
      )
      return
    }

    if (preferencesForm.endOfDayReminderEnabled && !preferencesForm.endOfDayReminderTime) {
      toast.error(
        'Nao foi possivel salvar suas configuracoes',
        'Defina o horario do lembrete antes de salvar.',
      )
      return
    }

    if (preferencesForm.quietHoursEnabled) {
      if (!preferencesForm.quietHoursStart || !preferencesForm.quietHoursEnd) {
        toast.error(
          'Nao foi possivel salvar suas configuracoes',
          'Defina o inicio e o fim do horario silencioso antes de salvar.',
        )
        return
      }

      if (
        !isQuietHoursRangeValid(
          preferencesForm.quietHoursStart,
          preferencesForm.quietHoursEnd,
        )
      ) {
        toast.error(
          'Nao foi possivel salvar suas configuracoes',
          'Escolha horarios validos e diferentes para o horario silencioso.',
        )
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
          quietHoursStart: preferencesForm.quietHoursStart || null,
          quietHoursEnd: preferencesForm.quietHoursEnd || null,
          clinicalDataSharingEnabled: preferencesForm.clinicalDataSharingEnabled,
          reportExportConfirmationEnabled:
            preferencesForm.reportExportConfirmationEnabled,
          deviceProtectionEnabled: preferencesForm.deviceProtectionEnabled,
          permissionReviewEnabled: preferencesForm.permissionReviewEnabled,
        }),
      ])

      setAccountDraftState(null)
      setPreferencesDraftState(null)
      toast.success(
        'Configuracoes salvas',
        'Suas preferencias de notificacoes foram atualizadas.',
      )
    } catch (error) {
      console.error('Failed to save patient settings:', error)
      toast.error(
        'Nao foi possivel salvar suas configuracoes',
        'Tente novamente em alguns instantes.',
      )
    }
  }

  async function handleReadNotification(notificationId: string) {
    try {
      await markAsRead(notificationId)
    } catch (error) {
      console.error('Failed to update patient notification:', error)
      toast.error(
        'Nao foi possivel atualizar este aviso',
        'Tente novamente em alguns instantes.',
      )
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
        title="Configurações"
        description="Ajuste seus dados, lembretes, notificações e privacidade."
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

      <div className="grid gap-5 xl:grid-cols-3">
        <StatCard
          label="Resumo diário"
          value={preferencesForm.dailySummaryEnabled ? preferencesForm.dailySummaryTime : 'Desativado'}
          hint={
            preferencesForm.dailySummaryEnabled
              ? 'Receba um resumo para começar o dia com uma visão rápida dos seus registros.'
              : 'Resumo diário desativado para sua conta.'
          }
          icon={Sparkles}
          tone="success"
        />
        <StatCard
          label="Lembrete do fim do dia"
          value={
            preferencesForm.endOfDayReminderEnabled
              ? preferencesForm.endOfDayReminderTime
              : 'Desativado'
          }
          hint={reminderHint}
          icon={Clock3}
          tone="default"
        />
        <StatCard
          label="Segurança da conta"
          value={protectionSummary.value}
          hint={protectionSummary.hint}
          icon={ShieldCheck}
          tone={protectionScore >= 3 ? 'success' : 'warning'}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SettingsSection eyebrow="Conta" title="Seus dados" icon={Sparkles}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome completo">
              <Input
                value={accountForm.fullName}
                onChange={(event) =>
                  setAccountForm((current) => ({ ...current, fullName: event.target.value }))
                }
                placeholder="Seu nome"
              />
            </Field>

            <Field label="E-mail" hint="Seu e-mail de acesso aparece aqui apenas para consulta.">
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
              <select
                value={accountForm.timezone}
                onChange={(event) =>
                  setAccountForm((current) => ({
                    ...current,
                    timezone: event.target.value,
                  }))
                }
                className="flex h-11 w-full rounded-xl border border-input bg-white/80 px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition-all focus:border-brand-300 focus:ring-4 focus:ring-brand-100/60"
              >
                {timezoneChoices.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <ToggleItem
            title="Configuração inicial"
            description="Marque se você já concluiu a configuração inicial da sua conta."
            checked={accountForm.onboardingCompleted}
            onChange={(checked) =>
              setAccountForm((current) => ({ ...current, onboardingCompleted: checked }))
            }
          />
        </SettingsSection>

        <SettingsSection
          eyebrow="Rotina e lembretes"
          title="Seu dia a dia"
          icon={CalendarClock}
        >
          <ToggleItem
            title="Resumo diário"
            description="Receba um resumo para começar o dia com uma visão rápida dos seus registros."
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

            <Field label="Horário do lembrete">
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
            title="Lembrete do fim do dia"
            description="Ajuda você a lembrar de registrar como se sentiu durante o dia."
            checked={preferencesForm.endOfDayReminderEnabled}
            onChange={(checked) =>
              setPreferencesForm((current) => ({
                ...current,
                endOfDayReminderEnabled: checked,
              }))
            }
          />
        </SettingsSection>

        <SettingsSection
          eyebrow="Notificações"
          title="Como você quer ser avisado"
          icon={BellRing}
        >
          <ToggleItem
            title="Notificações no aplicativo"
            description="Receba lembretes e avisos importantes dentro do FibroSync."
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
            description="Receba lembretes e comunicacoes importantes no seu e-mail."
            checked={preferencesForm.emailNotificationsEnabled}
            onChange={(checked) =>
              setPreferencesForm((current) => ({
                ...current,
                emailNotificationsEnabled: checked,
              }))
            }
          />

          <InlineInfo>
            O envio real por e-mail ainda esta em preparacao. Sua preferencia ja fica salva para uso futuro.
          </InlineInfo>

          <ToggleItem
            title="Horário silencioso"
            description="Escolha um periodo em que voce nao quer receber notificacoes."
            checked={preferencesForm.quietHoursEnabled}
            onChange={(checked) =>
              setPreferencesForm((current) => ({ ...current, quietHoursEnabled: checked }))
            }
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Início">
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

            <Field label="Fim">
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

          <InlineInfo>
            Durante esse periodo, lembretes nao serao exibidos. Eles poderao aparecer depois, caso ainda sejam relevantes.
          </InlineInfo>
        </SettingsSection>

        <SettingsSection
          eyebrow="Privacidade e segurança"
          title="Proteção da sua conta"
          icon={ShieldCheck}
        >
          <ToggleItem
            title="Compartilhamento com profissionais"
            description="Controle se seus dados podem ser compartilhados durante o acompanhamento com profissionais de saúde."
            checked={preferencesForm.clinicalDataSharingEnabled}
            onChange={(checked) =>
              setPreferencesForm((current) => ({
                ...current,
                clinicalDataSharingEnabled: checked,
              }))
            }
          />

          <ToggleItem
            title="Confirmar antes de exportar relatórios"
            description="Solicita sua confirmação antes de gerar ou compartilhar um relatório."
            checked={preferencesForm.reportExportConfirmationEnabled}
            onChange={(checked) =>
              setPreferencesForm((current) => ({
                ...current,
                reportExportConfirmationEnabled: checked,
              }))
            }
          />

          <ToggleItem
            title="Proteção adicional neste dispositivo"
            description="Ativa medidas extras de segurança para esta conta."
            checked={preferencesForm.deviceProtectionEnabled}
            onChange={(checked) =>
              setPreferencesForm((current) => ({
                ...current,
                deviceProtectionEnabled: checked,
              }))
            }
          />

          <ToggleItem
            title="Revisar acessos periodicamente"
            description="Lembra você de revisar configurações importantes de privacidade e acesso."
            checked={preferencesForm.permissionReviewEnabled}
            onChange={(checked) =>
              setPreferencesForm((current) => ({
                ...current,
                permissionReviewEnabled: checked,
              }))
            }
          />
        </SettingsSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <div className="card-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-label">Avisos recentes</p>
              <h2 className="mt-2 text-xl font-semibold md:text-2xl">Notificações da conta</h2>
            </div>
            <Badge variant={unreadCount > 0 ? 'warning' : 'success'}>
              {notificationBadgeLabel}
            </Badge>
          </div>

          <div className="mt-5 space-y-3">
            {isLoadingNotifications ? (
              <div className="flex min-h-[10rem] items-center justify-center">
                <LoaderCircle className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onRead={handleReadNotification}
                  disabled={isMarkingAsRead}
                />
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-white/80 bg-white/86 px-4 py-5 text-sm leading-6 text-muted-foreground shadow-soft">
                Quando houver lembretes ou avisos importantes, eles aparecerão aqui.
              </div>
            )}
          </div>
        </div>

        <div className="card-surface p-5">
          <p className="section-label">Status da conta</p>
          <div className="mt-4 rounded-[1.2rem] bg-brand-50/55 px-4 py-4">
            <p className="text-sm font-semibold text-foreground">Último acesso</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {user?.lastLoginAt ? formatDateTimeWithAtValue(user.lastLoginAt) : 'Sem registro'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
