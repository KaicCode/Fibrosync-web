import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  BellRing,
  Clock3,
  LoaderCircle,
  MapPin,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { useDailyRecords } from '@/hooks/useDailyRecords'
import { usePageTitle } from '@/hooks/use-page-title'
import { useUser } from '@/hooks/useUser'
import { resolveRoleLabel } from '@/lib/user-role'
import {
  calculateProfileCompletion,
  formatDateTimeWithAtValue,
  formatDateValue,
  formatHeightValue,
  formatWeightValue,
  resolveCountryLabel,
  resolveTimezoneLabel,
  resolveUserAvatar,
  resolveUserDisplayName,
  resolveUserInitials,
} from '@/lib/user-profile'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

type DetailItemProps = {
  label: string
  value: string
  valueClassName?: string
}

type ProfileFactCardProps = {
  label: string
  value: string
  hint: string
  icon: typeof ShieldCheck
  valueClassName?: string
}

type TrackingCardProps = {
  label: string
  value: string
  hint: string
  icon: typeof Activity
}

function DetailItem({ label, value, valueClassName }: DetailItemProps) {
  return (
    <div className="rounded-[1.2rem] border border-white/80 bg-white/84 px-4 py-4 shadow-soft">
      <p className="section-label">{label}</p>
      <p className={cn('mt-2 text-sm font-medium leading-6 text-foreground break-words', valueClassName)}>
        {value}
      </p>
    </div>
  )
}

function ProfileFactCard({
  label,
  value,
  hint,
  icon: Icon,
  valueClassName,
}: ProfileFactCardProps) {
  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/88 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="space-y-2">
            <p
              className={cn(
                'text-[1.4rem] font-semibold leading-[1.12] tracking-[-0.05em] text-foreground break-words md:text-[1.7rem]',
                valueClassName,
              )}
            >
              {value}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
          </div>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function TrackingCard({ label, value, hint, icon: Icon }: TrackingCardProps) {
  return (
    <div className="rounded-[1.25rem] border border-white/80 bg-white/84 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-[1.75rem] font-semibold tracking-[-0.05em] text-foreground">
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export function ProfilePage() {
  usePageTitle('Perfil')

  const authSession = useAppStore((state) => state.authSession)
  const { user, isLoading } = useUser()
  const { records, isLoading: isLoadingRecords } = useDailyRecords({ includeAll: true })

  const currentUser = user ?? authSession?.user ?? null
  const profileCompletion = calculateProfileCompletion(currentUser)
  const displayName = resolveUserDisplayName(currentUser)
  const countryLabel = resolveCountryLabel(currentUser?.countryCode)
  const timezoneLabel = resolveTimezoneLabel(currentUser?.timezone)
  const lastLoginLabel = currentUser?.lastLoginAt
    ? formatDateTimeWithAtValue(currentUser.lastLoginAt)
    : 'Sem acesso recente'

  const latestRecord = useMemo(() => {
    if (records.length === 0) {
      return null
    }

    return [...records].sort((left, right) => {
      const rightRecordTime = new Date(right.recordDate).getTime()
      const leftRecordTime = new Date(left.recordDate).getTime()

      if (rightRecordTime !== leftRecordTime) {
        return rightRecordTime - leftRecordTime
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })[0] ?? null
  }, [records])

  const uniqueAreas = useMemo(
    () => new Set(records.flatMap((record) => record.painAreas)),
    [records],
  )
  const uniqueTriggers = useMemo(
    () => new Set(records.flatMap((record) => record.painTriggers)),
    [records],
  )

  if (!currentUser && isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Seu perfil"
        description="Veja e acompanhe suas informações pessoais e dados da sua conta."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(19rem,0.88fr)]">
        <div className="card-surface p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Avatar className="h-20 w-20 rounded-[1.5rem]">
              <AvatarImage src={resolveUserAvatar(currentUser)} alt={displayName} />
              <AvatarFallback className="rounded-[1.5rem] text-lg">
                {resolveUserInitials(currentUser)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold leading-tight break-words">{displayName}</h2>
                <Badge variant={currentUser?.role === 'ADMIN' ? 'warning' : 'default'}>
                  {resolveRoleLabel(currentUser?.role)}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                Membro desde {formatDateValue(currentUser?.createdAt)}
              </p>

              <p className="max-w-2xl text-sm leading-6 text-muted-foreground break-words">
                {currentUser?.email ? (
                  <a
                    href={`mailto:${currentUser.email}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {currentUser.email}
                  </a>
                ) : (
                  'Sem e-mail disponível'
                )}{' '}
                • {countryLabel}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <ProfileFactCard
              label="Perfil completo"
              value={`${profileCompletion}%`}
              hint="Seus principais dados já estão preenchidos."
              icon={ShieldCheck}
            />
            <ProfileFactCard
              label="Último acesso"
              value={lastLoginLabel}
              hint="Mostra a última vez em que sua conta foi usada."
              icon={Clock3}
              valueClassName="text-[1.2rem] md:text-[1.45rem]"
            />
            <ProfileFactCard
              label="Fuso horário"
              value={timezoneLabel}
              hint="Usado para organizar datas e lembretes da sua conta."
              icon={MapPin}
              valueClassName="text-[1.3rem] md:text-[1.55rem]"
            />
          </div>
        </div>

        <div className="card-surface p-5">
          <p className="section-label">Seu acompanhamento</p>
          <div className="mt-4 space-y-3">
            <TrackingCard
              label="Registros realizados"
              value={isLoadingRecords ? '...' : records.length.toString()}
              hint="Registros feitos no seu acompanhamento."
              icon={Activity}
            />
            <TrackingCard
              label="Áreas do corpo registradas"
              value={isLoadingRecords ? '...' : uniqueAreas.size.toString()}
              hint="Regiões que já apareceram nos seus registros."
              icon={UserRound}
            />
            <TrackingCard
              label="Gatilhos identificados"
              value={isLoadingRecords ? '...' : uniqueTriggers.size.toString()}
              hint="Fatores que você já marcou durante os registros."
              icon={BellRing}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="card-surface p-5">
          <p className="section-label">Dados pessoais</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <DetailItem label="Nome completo" value={displayName} />
            <DetailItem
              label="E-mail"
              value={currentUser?.email ?? 'Nao informado'}
              valueClassName="break-all"
            />
            <DetailItem label="Nascimento" value={formatDateValue(currentUser?.birthDate)} />
            <DetailItem label="Gênero" value={currentUser?.gender ?? 'Nao informado'} />
            <DetailItem label="Altura" value={formatHeightValue(currentUser?.heightCm)} />
            <DetailItem label="Peso" value={formatWeightValue(currentUser?.weightKg)} />
            <DetailItem label="País" value={countryLabel} />
            <DetailItem label="Fuso horário" value={timezoneLabel} />
          </div>
        </div>

        <div className="card-surface p-5">
          <p className="section-label">Resumo da conta</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-[1.2rem] border border-white/80 bg-white/84 px-4 py-4 shadow-soft">
              <p className="text-sm font-medium text-foreground">Configuração inicial</p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {currentUser?.onboardingCompleted ? 'Concluída' : 'Ainda faltam algumas preferências.'}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {currentUser?.onboardingCompleted
                  ? 'Suas preferências básicas já foram definidas para personalizar melhor sua experiência.'
                  : 'Complete suas preferências para personalizar melhor sua experiência.'}
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-white/80 bg-white/84 px-4 py-4 shadow-soft">
              <p className="text-sm font-medium text-foreground">Último registro de dor</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground break-words">
                {latestRecord
                  ? `${formatDateValue(latestRecord.recordDate)} • ${latestRecord.painLevel}/10 • ${
                      latestRecord.painType || 'Tipo não informado'
                    }`
                  : 'Nenhum registro de dor salvo ainda.'}
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-white/80 bg-white/84 px-4 py-4 shadow-soft">
              <p className="text-sm font-medium text-foreground">Preferências</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Notificações, lembretes e privacidade podem ser ajustados em Configurações.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Settings className="h-4 w-4 text-brand-600" />
                  <span>Você pode revisar essas opções quando quiser.</span>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/app/settings">Abrir configurações</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
