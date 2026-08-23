import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  Database,
  FileText,
  RefreshCw,
  ShieldAlert,
  ShieldPlus,
  Stethoscope,
  UserPlus,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminContentSection } from '@/components/admin/cards/content-section'
import { AdminMetricCard } from '@/components/admin/cards/metric-card'
import { TrendLineChart } from '@/components/charts/trend-line-chart'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/admin.service'
import type {
  AdminDashboardPeriodOption,
} from '@/types/admin'

const PERIOD_OPTIONS: AdminDashboardPeriodOption[] = [7, 30, 90]

type GrowthMetricKey = 'total' | 'patients' | 'professionals'

type QuickAction = {
  title: string
  description: string
  href: string
  icon: typeof Users
}

const quickActions: QuickAction[] = [
  {
    title: 'Criar conta',
    description: 'Abra o gerenciamento de usuarios para criar um novo acesso.',
    href: '/admin/users',
    icon: UserPlus,
  },
  {
    title: 'Gerenciar usuarios',
    description: 'Consulte pacientes, profissionais e administradores.',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Relatorios',
    description: 'Gere e acompanhe exportacoes administrativas da plataforma.',
    href: '/admin/reports',
    icon: FileText,
  },
  {
    title: 'Profissionais',
    description: 'Revise contas medicas e pendencias de configuracao.',
    href: '/admin/users',
    icon: Stethoscope,
  },
]

function formatDateTime(value?: string | null): string {
  if (!value) {
    return 'Sem registro'
  }

  const date = new Date(value)
  const datePart = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

  return `${datePart} as ${timePart}`
}

function formatChartLabel(value: string, periodDays: AdminDashboardPeriodOption): string {
  const date = new Date(`${value}T12:00:00.000Z`)

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: periodDays === 90 ? '2-digit' : undefined,
  }).format(date)
}

function formatTooltipDate(value: string): string {
  const date = new Date(`${value}T12:00:00.000Z`)

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
  }).format(date)
}

function formatCompactValue(value: number): string {
  return value.toLocaleString('pt-BR')
}

function sumSeriesValues(values: Array<{ value: number }>): number {
  return values.reduce((sum, item) => sum + item.value, 0)
}

function resolveGrowthMetricLabel(metric: GrowthMetricKey): string {
  if (metric === 'patients') {
    return 'Novos pacientes'
  }

  if (metric === 'professionals') {
    return 'Novos profissionais'
  }

  return 'Novos usuarios'
}

function SectionErrorState({
  onRetry,
}: {
  onRetry: () => void
}) {
  return (
    <div className="rounded-[1.35rem] border border-rose-200 bg-rose-50/90 px-5 py-5">
      <p className="text-sm font-semibold text-rose-800">
        Nao foi possivel carregar esta informacao
      </p>
      <p className="mt-2 text-sm leading-6 text-rose-700">
        Tente novamente em alguns instantes.
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
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function SummaryTile({
  label,
  value,
  helper,
}: {
  label: string
  value: number
  helper: string
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/75 bg-white/82 px-4 py-4 shadow-soft">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">
        {formatCompactValue(value)}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
    </div>
  )
}

function DistributionRow({
  label,
  value,
  maxValue,
  colorClassName,
}: {
  label: string
  value: number
  maxValue: number
  colorClassName: string
}) {
  const width = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 8 : 0) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {formatCompactValue(value)}
        </p>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-[width]', colorClassName)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: QuickAction) {
  return (
    <article className="rounded-[1.35rem] border border-white/80 bg-white/84 p-5 shadow-soft">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 space-y-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <Button asChild variant="secondary" className="mt-5 w-full">
        <Link to={href}>Abrir</Link>
      </Button>
    </article>
  )
}

export function AdminDashboardPage() {
  usePageTitle('Visao geral administrativa')

  const [periodDays, setPeriodDays] = useState<AdminDashboardPeriodOption>(30)
  const [growthMetric, setGrowthMetric] = useState<GrowthMetricKey>('total')

  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard-overview', periodDays],
    queryFn: () => adminService.getDashboardOverview(periodDays),
    placeholderData: keepPreviousData,
  })

  const dashboard = dashboardQuery.data
  const overview = dashboard?.overview
  const activity = dashboard?.activity
  const growth = dashboard?.growth
  const professionals = dashboard?.professionals
  const distribution = dashboard?.distribution
  const recentActivity = dashboard?.recentActivity
  const pending = dashboard?.pending
  const platformStatus = dashboard?.platformStatus

  const isInitialLoading = dashboardQuery.isLoading && !dashboard
  const isRefreshing = dashboardQuery.isFetching && Boolean(dashboard)
  const hasOverviewIssue =
    dashboard?.issues.some((item) => item.section === 'overview') ?? false
  const hasProfessionalsIssue =
    dashboard?.issues.some((item) => item.section === 'professionals') ?? false

  const growthSeries = useMemo(
    () =>
      (growth?.series ?? []).map((point) => ({
        label: formatChartLabel(point.date, periodDays),
        tooltipLabel: formatTooltipDate(point.date),
        value: point[growthMetric],
      })),
    [growth?.series, growthMetric, periodDays],
  )

  const recordsSeries = useMemo(
    () =>
      (activity?.series ?? []).map((point) => ({
        label: formatChartLabel(point.date, periodDays),
        tooltipLabel: formatTooltipDate(point.date),
        value: point.total,
      })),
    [activity?.series, periodDays],
  )

  const growthTotal = sumSeriesValues(growthSeries)
  const recordsTotal = sumSeriesValues(recordsSeries)
  const distributionMax = Math.max(
    distribution?.patients ?? 0,
    distribution?.professionals ?? 0,
    distribution?.admins ?? 0,
  )
  const hasGlobalFailure = dashboardQuery.isError && !dashboard

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrador"
        title="Visao geral"
        description="Acompanhe usuarios, atividade e informacoes importantes da plataforma."
        actions={
          <div className="flex flex-col items-stretch gap-3 md:items-end">
            <Badge variant={isRefreshing ? 'warning' : 'neutral'}>
              {isRefreshing
                ? 'Atualizando dados...'
                : `Atualizado ${formatDateTime(
                    platformStatus?.checkedAt ?? dashboard?.generatedAt,
                  )}`}
            </Badge>
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={periodDays === option ? 'default' : 'secondary'}
                  onClick={() => setPeriodDays(option)}
                >
                  {option} dias
                </Button>
              ))}
            </div>
          </div>
        }
      />

      {hasGlobalFailure ? (
        <div className="card-surface p-6">
          <SectionErrorState onRetry={() => void dashboardQuery.refetch()} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Usuarios cadastrados"
          value={overview?.totalUsers ?? '—'}
          icon={Users}
          description="Total de contas na plataforma"
          meta={
            overview
              ? `${formatCompactValue(overview.newUsersInPeriod)} nos ultimos ${periodDays} dias`
              : hasOverviewIssue
                ? 'Nao foi possivel carregar esta metrica.'
              : undefined
          }
          variant="default"
          isLoading={isInitialLoading}
        />
        <AdminMetricCard
          label="Pacientes"
          value={overview?.patients ?? '—'}
          icon={Activity}
          description="Pacientes cadastrados"
          meta={
            overview
              ? `${formatCompactValue(overview.patients)} conta(s) de paciente`
              : hasOverviewIssue
                ? 'Nao foi possivel carregar esta metrica.'
              : undefined
          }
          variant="success"
          isLoading={isInitialLoading}
        />
        <AdminMetricCard
          label="Profissionais"
          value={overview?.professionals ?? '—'}
          icon={Stethoscope}
          description="Profissionais cadastrados"
          meta={
            professionals
              ? professionals.pending > 0
                ? `${formatCompactValue(professionals.pending)} aguardando configuracao`
                : 'Nenhum aguardando configuracao'
              : hasProfessionalsIssue
                ? 'Nao foi possivel carregar esta metrica.'
              : undefined
          }
          variant="warning"
          isLoading={isInitialLoading}
        />
        <AdminMetricCard
          label="Usuarios ativos"
          value={overview?.activeUsers ?? '—'}
          icon={ShieldPlus}
          description="Contas com atividade recente"
          meta={
            overview?.activeUsersDefinition ??
            (hasOverviewIssue ? 'Nao foi possivel carregar esta metrica.' : undefined)
          }
          variant="default"
          isLoading={isInitialLoading}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <AdminContentSection
          title="Crescimento da plataforma"
          description="Evolucao de novos cadastros ao longo do tempo."
          isLoading={isInitialLoading}
        >
          {growth ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {(['total', 'patients', 'professionals'] as const).map((metric) => (
                  <Button
                    key={metric}
                    type="button"
                    size="sm"
                    variant={growthMetric === metric ? 'default' : 'secondary'}
                    onClick={() => setGrowthMetric(metric)}
                  >
                    {metric === 'total'
                      ? 'Total'
                      : metric === 'patients'
                        ? 'Pacientes'
                        : 'Profissionais'}
                  </Button>
                ))}
              </div>

              {growthTotal === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum novo cadastro neste periodo.
                </p>
              ) : null}

              <TrendLineChart
                data={growthSeries}
                color="#3B82F6"
                height={240}
                primaryLabel={resolveGrowthMetricLabel(growthMetric)}
                emptyState={{
                  title: 'Nenhum novo cadastro neste periodo.',
                  description: 'Assim que novas contas forem criadas, a evolucao aparecera aqui.',
                }}
                singleRecordState={{
                  title: 'Ha apenas um dia com cadastro neste periodo.',
                  description: 'O grafico continuara crescendo conforme novas datas forem registradas.',
                }}
                tooltipValueFormatter={(value) =>
                  `${value} cadastro${value === 1 ? '' : 's'}`
                }
              />
            </div>
          ) : (
            <SectionErrorState onRetry={() => void dashboardQuery.refetch()} />
          )}
        </AdminContentSection>

        <AdminContentSection
          title="Usuarios por tipo de conta"
          description="Distribuicao atual entre pacientes, profissionais e administradores."
          isLoading={isInitialLoading}
        >
          {distribution ? (
            <div className="space-y-5">
              {distribution.patients === 0 &&
              distribution.professionals === 0 &&
              distribution.admins === 0 ? (
                <EmptyState
                  title="Nenhuma conta cadastrada ainda"
                  description="Assim que a plataforma receber novos acessos, a distribuicao aparecera aqui."
                />
              ) : null}

              <div className="space-y-4">
                <DistributionRow
                  label="Pacientes"
                  value={distribution.patients}
                  maxValue={distributionMax}
                  colorClassName="bg-brand-400"
                />
                <DistributionRow
                  label="Profissionais"
                  value={distribution.professionals}
                  maxValue={distributionMax}
                  colorClassName="bg-sky-400"
                />
                <DistributionRow
                  label="Administradores"
                  value={distribution.admins}
                  maxValue={distributionMax}
                  colorClassName="bg-emerald-400"
                />
              </div>
            </div>
          ) : (
            <SectionErrorState onRetry={() => void dashboardQuery.refetch()} />
          )}
        </AdminContentSection>
      </div>

      <AdminContentSection
        title="Atividade da plataforma"
        description="Indicadores reais de utilizacao da plataforma."
        isLoading={isInitialLoading}
      >
        {activity ? (
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryTile
              label="Registros realizados"
              value={activity.totalRecords}
              helper="Total de registros de acompanhamento realizados pelos pacientes."
            />
            <SummaryTile
              label={`Registros nos ultimos ${periodDays} dias`}
              value={activity.recordsInPeriod}
              helper="Quantidade registrada dentro do periodo selecionado."
            />
            <SummaryTile
              label="Pacientes que registraram recentemente"
              value={activity.patientsWithRecordsInPeriod}
              helper="Pacientes com pelo menos um registro no periodo selecionado."
            />
          </div>
        ) : (
          <SectionErrorState onRetry={() => void dashboardQuery.refetch()} />
        )}
      </AdminContentSection>

      <AdminContentSection
        title="Registros ao longo do tempo"
        description="Quantidade de registros realizados por dia."
        isLoading={isInitialLoading}
      >
        {activity ? (
          <div className="space-y-5">
            {recordsTotal === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum registro realizado neste periodo.
              </p>
            ) : null}

            <TrendLineChart
              data={recordsSeries}
              color="#0F766E"
              height={260}
              primaryLabel="Registros"
              emptyState={{
                title: 'Nenhum registro realizado neste periodo.',
                description: 'Quando os pacientes registrarem novos acompanhamentos, o volume aparecera aqui.',
              }}
              singleRecordState={{
                title: 'Ha apenas um dia com registros neste periodo.',
                description: 'O historico ficara mais detalhado conforme novos registros forem criados.',
              }}
              tooltipValueFormatter={(value) =>
                `${value} registro${value === 1 ? '' : 's'}`
              }
            />
          </div>
        ) : (
          <SectionErrorState onRetry={() => void dashboardQuery.refetch()} />
        )}
      </AdminContentSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminContentSection
          title="Profissionais"
          description="Acompanhe a situacao das contas profissionais."
          isLoading={isInitialLoading}
        >
          {professionals ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryTile
                  label="Total"
                  value={professionals.total}
                  helper="Profissionais cadastrados."
                />
                <SummaryTile
                  label="Ativos"
                  value={professionals.active}
                  helper="Contas profissionais prontas para uso."
                />
                <SummaryTile
                  label="Aguardando configuracao"
                  value={professionals.pending}
                  helper="Perfis que ainda precisam ser concluidos."
                />
                <SummaryTile
                  label="Suspensos"
                  value={professionals.suspended}
                  helper="Contas profissionais com acesso suspenso."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Aguardando conclusao
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Perfis profissionais que ainda nao terminaram a configuracao.
                    </p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link to="/admin/users">Gerenciar profissionais</Link>
                  </Button>
                </div>

                {professionals.pendingItems.length > 0 ? (
                  <div className="space-y-3">
                    {professionals.pendingItems.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-[1.25rem] border border-white/75 bg-white/82 px-4 py-4 shadow-soft"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">
                              {item.fullName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.specialty || 'Especialidade nao informada'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Conta criada em {formatDateTime(item.createdAt)}
                            </p>
                          </div>
                          <Badge variant="warning">Perfil incompleto</Badge>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Nenhum profissional aguardando configuracao"
                    description="Quando surgir uma nova pendencia de perfil profissional, ela aparecera aqui."
                  />
                )}
              </div>
            </div>
          ) : (
            <SectionErrorState onRetry={() => void dashboardQuery.refetch()} />
          )}
        </AdminContentSection>

        <AdminContentSection
          title="Atividade recente"
          description="Eventos operacionais reais que merecem acompanhamento."
          isLoading={isInitialLoading}
        >
          {recentActivity ? (
            recentActivity.items.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1.25rem] border border-white/75 bg-white/82 px-4 py-4 shadow-soft"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.type === 'PROFESSIONAL_COMPLETED_PROFILE'
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {item.type === 'PROFESSIONAL_COMPLETED_PROFILE'
                          ? 'Configuracao concluida'
                          : 'Novo cadastro'}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatDateTime(item.occurredAt)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhuma atividade recente"
                description="Novos cadastros e configuracoes importantes aparecerao aqui."
              />
            )
          ) : (
            <SectionErrorState onRetry={() => void dashboardQuery.refetch()} />
          )}
        </AdminContentSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminContentSection
          title="Pendencias"
          description="Itens que exigem atencao administrativa."
          isLoading={isInitialLoading}
        >
          {pending ? (
            pending.items.length > 0 ? (
              <div className="space-y-3">
                {pending.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1.25rem] border border-amber-100 bg-amber-50/85 px-4 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                        <Badge variant="warning">{item.status}</Badge>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhuma pendencia administrativa"
                description="No momento, nao ha itens operacionais exigindo atencao imediata."
              />
            )
          ) : (
            <SectionErrorState onRetry={() => void dashboardQuery.refetch()} />
          )}
        </AdminContentSection>

        <AdminContentSection
          title="Status da plataforma"
          description="Verificacoes reais da operacao atual."
          isLoading={isInitialLoading}
        >
          {platformStatus ? (
            <div className="space-y-4">
              <div className="rounded-[1.25rem] border border-white/75 bg-white/82 px-4 py-4 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">API</p>
                      <p className="text-sm text-muted-foreground">Operacional</p>
                    </div>
                  </div>
                  <Badge variant="success">Operacional</Badge>
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-white/75 bg-white/82 px-4 py-4 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Banco de dados</p>
                      <p className="text-sm text-muted-foreground">Operacional</p>
                    </div>
                  </div>
                  <Badge variant="success">Operacional</Badge>
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-white/75 bg-white/82 px-4 py-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Ultima verificacao</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(platformStatus.checkedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <SectionErrorState onRetry={() => void dashboardQuery.refetch()} />
          )}
        </AdminContentSection>
      </div>

      <AdminContentSection
        title="Acoes rapidas"
        description="Atalhos importantes para a rotina administrativa."
        isLoading={false}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} {...action} />
          ))}
        </div>
      </AdminContentSection>

      {dashboard && dashboard.issues.length > 0 ? (
        <div className="rounded-[1.35rem] border border-amber-100 bg-amber-50/85 px-5 py-4 text-sm text-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Algumas informacoes do dashboard nao puderam ser carregadas nesta
              atualizacao. O restante da pagina continua disponivel.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
