import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  CalendarDays,
  FileSearch,
  HeartPulse,
  Search,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminService } from '@/services/admin.service'
import { dailyRecordService, type DailyRecord } from '@/services/daily-record.service'
import {
  inferRoleFromPath,
  matchesNavigationItem,
  workspaceAiActivePathByVariant,
  workspaceConfig,
  workspaceDashboardPathByVariant,
} from '@/lib/navigation'

type SearchCardResult = {
  id: string
  title: string
  description: string
  to: string
  icon: LucideIcon
  eyebrow?: string
}

const suggestionPresets = {
  patient: ['dor', 'fadiga', 'relatorios', 'calendario'],
  medical: ['pacientes', 'evolucao', 'sinais clinicos'],
  admin: ['usuarios', 'sintomas', 'relatorios', 'analiticos'],
} as const

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function includesQuery(value: string | null | undefined, query: string): boolean {
  if (!value) {
    return false
  }

  return normalizeText(value).includes(normalizeText(query))
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateKey(value: string): string {
  return value.includes('T') ? value.split('T')[0] : value
}

function summarizeRecordMatch(record: DailyRecord, query: string): string {
  const matchedParts: string[] = []

  if (includesQuery(record.notes, query)) {
    matchedParts.push(record.notes ?? '')
  }

  if (includesQuery(record.painType, query)) {
    matchedParts.push(`Tipo de dor: ${record.painType}`)
  }

  const matchingAreas = record.painAreas.filter((area) => includesQuery(area, query)).slice(0, 2)
  if (matchingAreas.length > 0) {
    matchedParts.push(`Areas: ${matchingAreas.join(', ')}`)
  }

  const matchingTriggers = record.painTriggers
    .filter((trigger) => includesQuery(trigger, query))
    .slice(0, 2)
  if (matchingTriggers.length > 0) {
    matchedParts.push(`Gatilhos: ${matchingTriggers.join(', ')}`)
  }

  const matchingSymptoms = record.symptomEntries
    .filter(
      (entry) => includesQuery(entry.symptomName, query) || includesQuery(entry.notes, query),
    )
    .slice(0, 2)
    .map((entry) => entry.symptomName)
  if (matchingSymptoms.length > 0) {
    matchedParts.push(`Sintomas: ${matchingSymptoms.join(', ')}`)
  }

  if (matchedParts.length === 0) {
    matchedParts.push(
      `Dor ${record.painLevel}/10, fadiga ${record.fatigueLevel}/10 e humor ${record.moodLevel}/10.`,
    )
  }

  return matchedParts.join(' • ').slice(0, 190)
}

function buildPatientRecordResults(records: DailyRecord[], query: string): SearchCardResult[] {
  const normalizedQuery = normalizeText(query)

  return records
    .filter((record) => {
      const searchableValues = [
        record.notes ?? '',
        record.painType ?? '',
        ...record.painAreas,
        ...record.painTriggers,
        ...record.symptomEntries.flatMap((entry) => [entry.symptomName, entry.notes ?? '']),
      ]

      return searchableValues.some((value) => normalizeText(value).includes(normalizedQuery))
    })
    .slice(0, 6)
    .map((record) => ({
      id: record.id,
      title: `Registro de ${formatDateLabel(record.recordDate)}`,
      description: summarizeRecordMatch(record, query),
      to: `/app/pain-log?date=${formatDateKey(record.recordDate)}`,
      icon: CalendarDays,
      eyebrow: 'Registro clinico',
    }))
}

export function WorkspaceSearchPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const variant = inferRoleFromPath(location.pathname)
  const config = workspaceConfig[variant]
  const query = searchParams.get('q')?.trim() ?? ''
  const dashboardPath = workspaceDashboardPathByVariant[variant]
  const aiPath = workspaceAiActivePathByVariant[variant]

  const patientRecordsQuery = useQuery({
    queryKey: ['workspace-search-records', query],
    queryFn: () => dailyRecordService.getDailyRecords({ includeAll: true }),
    enabled: variant === 'patient' && query.length >= 2,
  })

  const adminUsersQuery = useQuery({
    queryKey: ['workspace-search-admin-users', query],
    queryFn: () => adminService.getUsers({ search: query, limit: 5 }),
    enabled: variant === 'admin' && query.length >= 2,
  })

  const adminSymptomsQuery = useQuery({
    queryKey: ['workspace-search-admin-symptoms', query],
    queryFn: () => adminService.getSymptoms({ search: query, limit: 5 }),
    enabled: variant === 'admin' && query.length >= 2,
  })

  const navigationResults = useMemo<SearchCardResult[]>(
    () =>
      query
        ? config.navigation
            .filter((item) => matchesNavigationItem(item, query))
            .map((item) => ({
              id: item.to,
              title: item.label,
              description: item.description,
              to: item.to,
              icon: item.icon,
              eyebrow: 'Navegacao',
            }))
        : [],
    [config.navigation, query],
  )

  const patientRecordResults = useMemo(
    () =>
      variant === 'patient' && patientRecordsQuery.data
        ? buildPatientRecordResults(patientRecordsQuery.data, query)
        : [],
    [patientRecordsQuery.data, query, variant],
  )

  const adminUserResults = useMemo<SearchCardResult[]>(
    () =>
      variant === 'admin'
        ? (adminUsersQuery.data?.items ?? []).map((user) => ({
            id: user.id,
            title: user.fullName,
            description: `${user.email} • ${user.role === 'ADMIN' ? 'Administrador' : 'Paciente'}`,
            to: '/admin/users',
            icon: Users,
            eyebrow: 'Usuario',
          }))
        : [],
    [adminUsersQuery.data?.items, variant],
  )

  const adminSymptomResults = useMemo<SearchCardResult[]>(
    () =>
      variant === 'admin'
        ? (adminSymptomsQuery.data?.items ?? []).map((record) => ({
            id: record.id,
            title: record.user.fullName,
            description: `${record.user.email} • ${record.notes ?? 'Registro de sintoma encontrado'}`,
            to: '/admin/symptoms',
            icon: HeartPulse,
            eyebrow: 'Sintoma',
          }))
        : [],
    [adminSymptomsQuery.data?.items, variant],
  )

  const totalResults =
    navigationResults.length +
    patientRecordResults.length +
    adminUserResults.length +
    adminSymptomResults.length

  const isLoading =
    patientRecordsQuery.isLoading || adminUsersQuery.isLoading || adminSymptomsQuery.isLoading

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Busca global"
        title={query ? `Resultados para "${query}"` : 'Encontre o que precisa no FibroSync'}
        description={
          query
            ? `Buscando dentro do contexto ${config.shortLabel.toLowerCase()} com atalhos, paginas e dados relacionados.`
            : 'Use a barra de pesquisa do topo para encontrar areas, usuarios, registros e atalhos rapidamente.'
        }
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link to={dashboardPath}>Voltar ao dashboard</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={aiPath}>
                <Sparkles className="h-4 w-4" />
                IA ativa
              </Link>
            </Button>
          </>
        }
      />

      {!query ? (
        <div className="panel-surface p-6 md:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.7rem] bg-brand-gradient text-white shadow-glow">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-foreground md:text-3xl">
              A busca global esta pronta para te ajudar
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
              Digite na barra do topo e pressione Enter para buscar paginas, dados e atalhos do
              seu contexto atual.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestionPresets[variant].map((item) => (
                <Button key={item} asChild variant="outline" size="sm">
                  <Link to={`${location.pathname}?q=${encodeURIComponent(item)}`}>{item}</Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card-surface p-5">
              <p className="section-label">Contexto</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{config.shortLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">Busca aplicada ao espaco atual.</p>
            </div>
            <div className="card-surface p-5">
              <p className="section-label">Resultados</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{totalResults}</p>
              <p className="mt-1 text-sm text-muted-foreground">Atalhos e dados encontrados.</p>
            </div>
            <div className="card-surface p-5">
              <p className="section-label">Status</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {isLoading ? 'Buscando...' : 'Pronto'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isLoading ? 'Carregando fontes relevantes.' : 'Resultados atualizados.'}
              </p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
            <div className="space-y-5">
              <SearchSection
                title="Atalhos de navegacao"
                description="Paginas e areas que combinam com sua busca."
                results={navigationResults}
                emptyMessage="Nenhuma pagina do contexto atual combinou com essa busca."
              />

              {variant === 'patient' ? (
                <SearchSection
                  title="Registros clinicos"
                  description="Correspondencias encontradas nos seus registros e sintomas."
                  results={patientRecordResults}
                  emptyMessage="Nao encontrei registros clinicos relacionados a esse termo."
                  isLoading={patientRecordsQuery.isLoading}
                />
              ) : null}

              {variant === 'admin' ? (
                <>
                  <SearchSection
                    title="Usuarios encontrados"
                    description="Correspondencias na base de usuarios da plataforma."
                    results={adminUserResults}
                    emptyMessage="Nenhum usuario combinou com esse termo."
                    isLoading={adminUsersQuery.isLoading}
                  />
                  <SearchSection
                    title="Sintomas e registros"
                    description="Correspondencias em sinais clinicos e observacoes."
                    results={adminSymptomResults}
                    emptyMessage="Nenhum sintoma ou registro clinico combinou com esse termo."
                    isLoading={adminSymptomsQuery.isLoading}
                  />
                </>
              ) : null}
            </div>

            <div className="space-y-5">
              <div className="card-surface p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    {variant === 'admin' ? (
                      <Users className="h-5 w-5" />
                    ) : variant === 'medical' ? (
                      <Stethoscope className="h-5 w-5" />
                    ) : (
                      <FileSearch className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="section-label">Dicas de busca</p>
                    <h2 className="mt-1 text-xl font-semibold text-foreground">Busque melhor</h2>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Use termos curtos e diretos como nomes, emails, sintomas ou categorias.</p>
                  <p>A busca considera paginas do contexto atual e dados reais quando disponiveis.</p>
                  <p>Se quiser ir mais rapido, clique nos atalhos sugeridos pela barra do topo.</p>
                </div>
              </div>

              <div className="card-surface p-5">
                <p className="section-label">Sugestoes populares</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {suggestionPresets[variant].map((item) => (
                    <Button key={item} asChild variant="secondary" size="sm">
                      <Link to={`?q=${encodeURIComponent(item)}`}>{item}</Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {!isLoading && totalResults === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="panel-surface p-6 text-center md:p-8"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.7rem] bg-brand-50 text-brand-700">
                <Search className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-foreground">
                Nenhum resultado encontrado
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                Tente buscar por outros termos ou use os atalhos abaixo para voltar a um ponto
                conhecido do FibroSync.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button asChild size="sm">
                  <Link to={dashboardPath}>Ir para o dashboard</Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link to={aiPath}>Abrir IA ativa</Link>
                </Button>
              </div>
            </motion.div>
          ) : null}
        </>
      )}
    </div>
  )
}

function SearchSection({
  title,
  description,
  results,
  emptyMessage,
  isLoading = false,
}: {
  title: string
  description: string
  results: SearchCardResult[]
  emptyMessage: string
  isLoading?: boolean
}) {
  return (
    <div className="card-surface p-5">
      <div className="mb-4 space-y-1">
        <p className="section-label">{title}</p>
        <h2 className="text-xl font-semibold text-foreground">{description}</h2>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando resultados...</p>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.28 }}
            >
              <Link
                to={result.to}
                className="flex items-start gap-3 rounded-[1.2rem] border border-white/75 bg-white/78 px-4 py-3 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200/70 hover:bg-brand-50/55"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <result.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  {result.eyebrow ? <p className="section-label">{result.eyebrow}</p> : null}
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">
                    {result.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {result.description}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  )
}
