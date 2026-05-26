import { Activity, BellRing, Clock3, LoaderCircle, MapPin, Settings, ShieldCheck, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/stat-card'
import { usePageTitle } from '@/hooks/use-page-title'
import { useDailyRecords } from '@/hooks/useDailyRecords'
import { useUser } from '@/hooks/useUser'
import {
  calculateProfileCompletion,
  formatDateValue,
  formatHeightValue,
  formatWeightValue,
  resolveCountryLabel,
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
  helperBadge?: string
  valueClassName?: string
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
  helperBadge,
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
                'text-[1.55rem] font-semibold leading-[1.08] tracking-[-0.05em] text-foreground break-words md:text-[1.8rem]',
                valueClassName,
              )}
            >
              {value}
            </p>
            {helperBadge ? (
              <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brand-700">
                {helperBadge}
              </span>
            ) : null}
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

function formatLastLoginParts(value?: string | null): {
  value: string
  hint: string
  helperBadge?: string
} {
  if (!value) {
    return {
      value: 'Sem acesso recente',
      hint: 'Ainda nao existe um login registrado para esta conta.',
    }
  }

  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

  return {
    value: date,
    hint: 'Ultima sessao registrada na plataforma.',
    helperBadge: time,
  }
}

function formatTimezoneParts(value?: string | null): {
  value: string
  hint: string
} {
  if (!value) {
    return {
      value: 'Nao informado',
      hint: 'O fuso horario da conta ainda nao foi definido.',
    }
  }

  const city = value.split('/').at(-1)?.replaceAll('_', ' ') ?? value

  return {
    value: city,
    hint: value,
  }
}

export function ProfilePage() {
  usePageTitle('Perfil')

  const authSession = useAppStore((state) => state.authSession)
  const { user, isLoading } = useUser()
  const { records, isLoading: isLoadingRecords } = useDailyRecords({ limit: 100 })

  const currentUser = user ?? authSession?.user ?? null
  const profileCompletion = calculateProfileCompletion(currentUser)
  const displayName = resolveUserDisplayName(currentUser)
  const totalRecords = records.length
  const latestRecord = records[0] ?? null
  const uniqueAreas = new Set(records.flatMap((record) => record.painAreas))
  const uniqueTriggers = new Set(records.flatMap((record) => record.painTriggers))
  const lastLogin = formatLastLoginParts(currentUser?.lastLoginAt)
  const timezone = formatTimezoneParts(currentUser?.timezone)

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
        eyebrow="Perfil e progresso"
        title="Seu perfil em uma visão mais clara"
        description="Nome, avatar, dados do cadastro e resumo da conta organizados para leitura rápida e confortável."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(19rem,0.92fr)]">
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
                  {currentUser?.role === 'ADMIN' ? 'Administrador' : 'Paciente'}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                Membro desde {formatDateValue(currentUser?.createdAt)}
              </p>

              <p className="max-w-2xl text-sm leading-6 text-muted-foreground break-words">
                {currentUser?.email ?? 'Sem e-mail disponível'} • {resolveCountryLabel(currentUser?.countryCode)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            <ProfileFactCard
              label="Perfil preenchido"
              value={`${profileCompletion}%`}
              hint="Com base nos dados do cadastro."
              icon={ShieldCheck}
            />
            <ProfileFactCard
              label="Último login"
              value={lastLogin.value}
              hint={lastLogin.hint}
              helperBadge={lastLogin.helperBadge}
              icon={Clock3}
              valueClassName="text-[1.4rem] md:text-[1.6rem]"
            />
            <ProfileFactCard
              label="Fuso da conta"
              value={timezone.value}
              hint={timezone.hint}
              icon={MapPin}
              valueClassName="text-[1.35rem] md:text-[1.55rem]"
            />
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <p className="font-medium text-foreground">Completude do perfil</p>
              <p className="text-muted-foreground">{profileCompletion}%</p>
            </div>
            <Progress value={profileCompletion} />
          </div>
        </div>

        <div className="space-y-5">
          <StatCard
            label="Registros salvos"
            value={isLoadingRecords ? '...' : totalRecords.toString()}
            hint="Últimos registros carregados no app"
            icon={Activity}
            className="min-h-[10.5rem]"
          />
          <StatCard
            label="Áreas monitoradas"
            value={isLoadingRecords ? '...' : uniqueAreas.size.toString()}
            hint="Pontos do corpo já registrados"
            icon={UserRound}
            className="min-h-[10.5rem]"
          />
          <StatCard
            label="Gatilhos distintos"
            value={isLoadingRecords ? '...' : uniqueTriggers.size.toString()}
            hint="Fatores já marcados no diário"
            icon={BellRing}
            className="min-h-[10.5rem]"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="card-surface p-5">
          <p className="section-label">Dados cadastrais</p>
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
            <DetailItem label="País" value={resolveCountryLabel(currentUser?.countryCode)} />
            <DetailItem
              label="Fuso horário"
              value={currentUser?.timezone ?? 'Nao informado'}
              valueClassName="break-words"
            />
          </div>
        </div>

        <div className="card-surface p-5">
          <p className="section-label">Resumo da conta</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-[1.2rem] border border-white/80 bg-white/84 px-4 py-4 shadow-soft">
              <p className="text-sm font-medium text-foreground">Onboarding</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {currentUser?.onboardingCompleted
                  ? 'Concluído. Sua conta já passou pela configuração inicial.'
                  : 'Ainda em andamento. Complete suas preferências para personalizar melhor a experiência.'}
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-white/80 bg-white/84 px-4 py-4 shadow-soft">
              <p className="text-sm font-medium text-foreground">Último registro de dor</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground break-words">
                {latestRecord
                  ? `${latestRecord.recordDate} • ${latestRecord.painLevel}/10 • ${latestRecord.painType || 'Tipo não informado'}`
                  : 'Nenhum registro de dor salvo ainda.'}
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-white/80 bg-white/84 px-4 py-4 shadow-soft">
              <p className="text-sm font-medium text-foreground">Preferências rápidas</p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>Notificações e lembretes seguem disponíveis na área de configurações.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Settings className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>As informações exibidas aqui são atualizadas com base no cadastro e no uso real da conta.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
