import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  BellRing,
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
import { useUserSettings } from '@/hooks/useUserSettings'
import type { UserSettings } from '@/services/user-settings.service'
import { toast } from '@/store/toast-store'
import { formatMedicalDateTime } from './medical-shared'

type SettingsFormState = {
  dailySummaryEnabled: boolean
  dailySummaryTime: string
  smartSearchEnabled: boolean
  calendarInsightsEnabled: boolean
  inAppNotificationsEnabled: boolean
  emailNotificationsEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  reportExportConfirmationEnabled: boolean
  deviceProtectionEnabled: boolean
  permissionReviewEnabled: boolean
}

function buildSettingsFormState(
  settings: UserSettings | null | undefined,
): SettingsFormState {
  return {
    dailySummaryEnabled: settings?.dailySummaryEnabled ?? true,
    dailySummaryTime: settings?.dailySummaryTime ?? '08:00',
    smartSearchEnabled: settings?.smartSearchEnabled ?? true,
    calendarInsightsEnabled: settings?.calendarInsightsEnabled ?? true,
    inAppNotificationsEnabled: settings?.inAppNotificationsEnabled ?? true,
    emailNotificationsEnabled: settings?.emailNotificationsEnabled ?? false,
    quietHoursEnabled: settings?.quietHoursEnabled ?? false,
    quietHoursStart: settings?.quietHoursStart ?? '22:00',
    quietHoursEnd: settings?.quietHoursEnd ?? '06:30',
    reportExportConfirmationEnabled:
      settings?.reportExportConfirmationEnabled ?? true,
    deviceProtectionEnabled: settings?.deviceProtectionEnabled ?? true,
    permissionReviewEnabled: settings?.permissionReviewEnabled ?? true,
  }
}

export function MedicalSettingsPage() {
  usePageTitle('Configurações médicas')

  const { settings, isLoading, updateSettings, isUpdating } = useUserSettings()
  const {
    notifications,
    isLoading: isLoadingNotifications,
    unreadCount,
    markAsRead,
    isMarkingAsRead,
  } = useNotifications({ limit: 8, page: 1 })
  const [draft, setDraft] = useState<Partial<SettingsFormState>>({})
  const form = {
    ...buildSettingsFormState(settings),
    ...draft,
  }

  async function handleSave() {
    try {
      await updateSettings({
        dailySummaryEnabled: form.dailySummaryEnabled,
        dailySummaryTime: form.dailySummaryTime,
        smartSearchEnabled: form.smartSearchEnabled,
        calendarInsightsEnabled: form.calendarInsightsEnabled,
        inAppNotificationsEnabled: form.inAppNotificationsEnabled,
        emailNotificationsEnabled: form.emailNotificationsEnabled,
        quietHoursEnabled: form.quietHoursEnabled,
        quietHoursStart: form.quietHoursEnabled ? form.quietHoursStart : null,
        quietHoursEnd: form.quietHoursEnabled ? form.quietHoursEnd : null,
        reportExportConfirmationEnabled:
          form.reportExportConfirmationEnabled,
        deviceProtectionEnabled: form.deviceProtectionEnabled,
        permissionReviewEnabled: form.permissionReviewEnabled,
      })
      setDraft({})

      toast.success(
        'Configurações atualizadas',
        'As preferências do módulo médico foram salvas.',
      )
    } catch {
      toast.error(
        'Não foi possível salvar as configurações',
        'Tente novamente em alguns instantes.',
      )
    }
  }

  async function handleReadNotification(notificationId: string) {
    try {
      await markAsRead(notificationId)
    } catch {
      toast.error(
        'Não foi possível atualizar esta notificação',
        'Tente novamente.',
      )
    }
  }

  if (isLoading && !settings) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Configurações"
        title="Preferências do módulo clínico"
        description="Gerencie notificações, segurança e o comportamento do painel médico."
        actions={
          <Button onClick={() => void handleSave()} disabled={isUpdating}>
            <Save className="h-4 w-4" />
            {isUpdating ? 'Salvando...' : 'Salvar ajustes'}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Notificações não lidas"
          value={String(unreadCount)}
          hint="Alertas ainda pendentes de leitura"
          icon={BellRing}
        />
        <StatCard
          label="Resumo diário"
          value={form.dailySummaryEnabled ? form.dailySummaryTime : 'Desativado'}
          hint="Horário do resumo do painel"
          icon={Clock3}
        />
        <StatCard
          label="Alertas por e-mail"
          value={form.emailNotificationsEnabled ? 'Ativos' : 'Desativados'}
          hint="Canal complementar de notificação"
          icon={Sparkles}
        />
        <StatCard
          label="Proteção da conta"
          value={form.deviceProtectionEnabled ? 'Ativa' : 'Básica'}
          hint="Camada adicional de segurança"
          icon={ShieldCheck}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SettingsSection
          eyebrow="Painel"
          title="Preferências de uso"
          icon={Sparkles}
        >
          <ToggleItem
            title="Resumo diário do painel"
            description="Receba um resumo diário com a atividade recente dos pacientes vinculados."
            checked={form.dailySummaryEnabled}
            onChange={(checked) =>
              setDraft((current) => ({
                ...current,
                dailySummaryEnabled: checked,
              }))
            }
          />

          <Field label="Horário do resumo diário">
            <Input
              type="time"
              value={form.dailySummaryTime}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  dailySummaryTime: event.target.value,
                }))
              }
              disabled={!form.dailySummaryEnabled}
            />
          </Field>

          <ToggleItem
            title="Busca inteligente"
            description="Prioriza pacientes e conteúdos recentes nas pesquisas internas."
            checked={form.smartSearchEnabled}
            onChange={(checked) =>
              setDraft((current) => ({
                ...current,
                smartSearchEnabled: checked,
              }))
            }
          />

          <ToggleItem
            title="Destaques de histórico"
            description="Exibe atalhos e resumos do histórico clínico nas páginas médicas."
            checked={form.calendarInsightsEnabled}
            onChange={(checked) =>
              setDraft((current) => ({
                ...current,
                calendarInsightsEnabled: checked,
              }))
            }
          />

          <ToggleItem
            title="Confirmar exportações"
            description="Solicita confirmação antes de abrir relatórios gerados ou arquivos exportados."
            checked={form.reportExportConfirmationEnabled}
            onChange={(checked) =>
              setDraft((current) => ({
                ...current,
                reportExportConfirmationEnabled: checked,
              }))
            }
          />
        </SettingsSection>

        <SettingsSection
          eyebrow="Alertas e segurança"
          title="Notificações da conta"
          icon={ShieldCheck}
        >
          <ToggleItem
            title="Notificações no aplicativo"
            description="Mostra avisos de novos relatórios, registros recentes e atualizações relevantes."
            checked={form.inAppNotificationsEnabled}
            onChange={(checked) =>
              setDraft((current) => ({
                ...current,
                inAppNotificationsEnabled: checked,
              }))
            }
          />

          <ToggleItem
            title="Notificações por e-mail"
            description="Envia um canal complementar para eventos importantes do painel clínico."
            checked={form.emailNotificationsEnabled}
            onChange={(checked) =>
              setDraft((current) => ({
                ...current,
                emailNotificationsEnabled: checked,
              }))
            }
          />

          <ToggleItem
            title="Horas de silêncio"
            description="Reduz alertas em horários definidos, mantendo apenas o essencial."
            checked={form.quietHoursEnabled}
            onChange={(checked) =>
              setDraft((current) => ({
                ...current,
                quietHoursEnabled: checked,
              }))
            }
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Início">
              <Input
                type="time"
              value={form.quietHoursStart}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  quietHoursStart: event.target.value,
                }))
                }
                disabled={!form.quietHoursEnabled}
              />
            </Field>
            <Field label="Fim">
              <Input
                type="time"
              value={form.quietHoursEnd}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  quietHoursEnd: event.target.value,
                }))
                }
                disabled={!form.quietHoursEnabled}
              />
            </Field>
          </div>

          <ToggleItem
            title="Proteção do dispositivo"
            description="Mantém verificações adicionais para reforçar a segurança da sessão."
            checked={form.deviceProtectionEnabled}
            onChange={(checked) =>
              setDraft((current) => ({
                ...current,
                deviceProtectionEnabled: checked,
              }))
            }
          />

          <ToggleItem
            title="Revisão periódica de permissões"
            description="Lembra você de revisar acessos e preferências de segurança ao longo do tempo."
            checked={form.permissionReviewEnabled}
            onChange={(checked) =>
              setDraft((current) => ({
                ...current,
                permissionReviewEnabled: checked,
              }))
            }
          />
        </SettingsSection>
      </div>

      <div className="card-surface p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-label">Notificações recentes</p>
            <h2 className="mt-2 text-xl font-semibold md:text-2xl">
              Central de alertas do profissional
            </h2>
          </div>
          <Badge variant={unreadCount > 0 ? 'warning' : 'success'}>
            {unreadCount > 0 ? `${unreadCount} pendentes` : 'Tudo em dia'}
          </Badge>
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          O consentimento de compartilhamento clínico é controlado pelo paciente.
          Aqui você ajusta apenas preferências da sua própria conta.
        </p>

        <div className="mt-5 space-y-3">
          {isLoadingNotifications ? (
            <div className="space-y-3">
              <div className="h-24 rounded-[1.25rem] bg-white/70" />
              <div className="h-24 rounded-[1.25rem] bg-white/70" />
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
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatMedicalDateTime(notification.createdAt)}
                    </p>
                  </div>

                  {!notification.read ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isMarkingAsRead}
                      onClick={() => void handleReadNotification(notification.id)}
                    >
                      Marcar como lida
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.25rem] border border-white/80 bg-white/86 px-4 py-5 shadow-soft">
              <p className="text-sm leading-6 text-muted-foreground">
                Nenhuma notificação recente para esta conta.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
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
  icon: typeof Sparkles
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

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="space-y-2">
      <p className="text-sm font-semibold text-foreground">{label}</p>
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
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
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
