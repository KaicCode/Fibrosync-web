import { useQuery } from '@tanstack/react-query'
import { HeartPulse, ShieldPlus, UserRound, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminMetricCard } from '@/components/admin/cards/metric-card'
import { AdminContentSection } from '@/components/admin/cards/content-section'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'
import { adminService } from '@/services/admin.service'

function resolveSymptomHighlights(record: {
  cognitiveFog: boolean
  sensitivityLight: boolean
  sensitivityNoise: boolean
  digestiveIssues: boolean
  headache: boolean
  anxiety: boolean
  depression: boolean
}) {
  const flags: string[] = []

  if (record.cognitiveFog) flags.push('Fibro fog')
  if (record.sensitivityLight) flags.push('Luz')
  if (record.sensitivityNoise) flags.push('Ruido')
  if (record.digestiveIssues) flags.push('Digestivo')
  if (record.headache) flags.push('Cefaleia')
  if (record.anxiety) flags.push('Ansiedade')
  if (record.depression) flags.push('Humor depressivo')

  return flags
}

export function AdminDashboardPage() {
  usePageTitle('Dashboard Admin')

  const usersQuery = useQuery({
    queryKey: ['admin-dashboard-users'],
    queryFn: () => adminService.getUsers({ page: 1, limit: 6 }),
  })

  const adminsQuery = useQuery({
    queryKey: ['admin-dashboard-admins'],
    queryFn: () => adminService.getUsers({ page: 1, limit: 1, role: 'ADMIN' }),
  })

  const symptomsQuery = useQuery({
    queryKey: ['admin-dashboard-symptoms'],
    queryFn: () => adminService.getSymptoms({ page: 1, limit: 6 }),
  })

  const isLoading =
    usersQuery.isLoading || adminsQuery.isLoading || symptomsQuery.isLoading

  const users = usersQuery.data?.items ?? []
  const symptoms = symptomsQuery.data?.items ?? []
  const totalUsers = usersQuery.data?.meta.total ?? 0
  const totalAdmins = adminsQuery.data?.meta.total ?? 0
  const totalSymptoms = symptomsQuery.data?.meta.total ?? 0
  const linkedSignals = symptoms.filter((item) => item.dailyRecordId).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="FibroSync Admin"
        title="Operação administrativa"
        description="Acompanhe contas, sinais clínicos e ações rápidas da plataforma em um único workspace."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link to="/admin/users">Gerenciar usuarios</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/symptoms">Gerenciar sintomas</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Contas ativas"
          value={totalUsers}
          icon={Users}
          description="Usuarios com acesso disponivel na plataforma"
          variant="default"
        />
        <AdminMetricCard
          label="Administradores"
          value={totalAdmins}
          icon={ShieldPlus}
          description="Contas com controle operacional do sistema"
          variant="warning"
        />
        <AdminMetricCard
          label="Sinais monitorados"
          value={totalSymptoms}
          icon={HeartPulse}
          description="Registros de sintomas acessiveis pelo admin"
          variant="success"
        />
        <AdminMetricCard
          label="Sinais ligados ao diario"
          value={linkedSignals}
          icon={UserRound}
          description="Snapshots que nasceram do fluxo clinico do paciente"
          variant="default"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <AdminContentSection
          title="Usuarios recentes"
          description="Ultimas contas ativas visiveis para operacao"
          isLoading={isLoading}
        >
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-white/75 bg-white/70 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {user.fullName}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">
                    {user.role === 'ADMIN' ? 'Admin' : 'Paciente'}
                  </Badge>
                  <Badge variant={user.onboardingCompleted ? 'success' : 'warning'}>
                    {user.onboardingCompleted ? 'Onboarding ok' : 'Onboarding pendente'}
                  </Badge>
                </div>
              </div>
            ))}

            {users.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma conta encontrada no momento.
              </p>
            ) : null}
          </div>
        </AdminContentSection>

        <AdminContentSection
          title="Sinais clinicos recentes"
          description="Ultimos sintomas acessiveis para monitoramento administrativo"
          isLoading={isLoading}
        >
          <div className="space-y-3">
            {symptoms.map((record) => {
              const highlights = resolveSymptomHighlights(record)

              return (
                <div
                  key={record.id}
                  className="rounded-[1.15rem] border border-white/75 bg-white/70 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {record.user.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.user.email}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={record.dailyRecordId ? 'warning' : 'neutral'}>
                        {record.dailyRecordId ? 'Ligado ao diario' : 'Sinal isolado'}
                      </Badge>
                      {record.bodyTemperatureFeeling ? (
                        <Badge variant="neutral">
                          {record.bodyTemperatureFeeling}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Fadiga {record.fatigueLevel}/10</span>
                    <span>Sono {record.sleepQuality}/10</span>
                    <span>Rigidez {record.stiffness}/10</span>
                    <span>Humor {record.mood}/10</span>
                    <span>Estresse {record.stress}/10</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {highlights.length > 0 ? (
                      highlights.map((label) => (
                        <Badge key={label} variant="neutral">
                          {label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Nenhuma flag adicional ativa
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {symptoms.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum sinal recente encontrado.
              </p>
            ) : null}
          </div>
        </AdminContentSection>
      </div>
    </div>
  )
}
