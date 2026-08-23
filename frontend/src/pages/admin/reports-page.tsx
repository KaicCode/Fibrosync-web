import { useMemo, useState } from 'react'
import {
  FileJson,
  FileText,
  HeartPulse,
  Loader,
  TrendingUp,
  Users,
} from 'lucide-react'
import { ReportsTable } from '@/components/admin/tables/reports-table'
import { AdminContentSection } from '@/components/admin/cards/content-section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/page-header'
import {
  buildAdminReportFileName,
  createAnalyticsReportArtifacts,
  createDownloadBlob,
  createFollowUpReportArtifacts,
  createUsersReportArtifacts,
  downloadBlob,
} from '@/lib/admin-report-export'
import { usePageTitle } from '@/hooks/use-page-title'
import { adminService } from '@/services/admin.service'
import { useAppStore } from '@/store/app-store'
import { toast } from '@/store/toast-store'
import type {
  AdminReport,
  AdminReportHistoryItem,
  AdminSymptomRecord,
  AdminUser,
} from '@/types/admin'

const REPORT_HISTORY_STORAGE_KEY = 'fibrosync-admin-reports-history'
const REPORT_HISTORY_LIMIT = 12
const PAGE_SIZE = 100

type HistoryPeriodFilter = 'all' | '7' | '30' | '90'
type HistoryTypeFilter = 'all' | AdminReport['type']
type HistoryFormatFilter = 'all' | AdminReport['format']

const reportCatalog: Array<{
  type: AdminReport['type']
  title: string
  description: string
  icon: typeof Users
  includedItems: string[]
}> = [
  {
    type: 'users',
    title: 'Relatório de usuários',
    description:
      'Visão consolidada das contas cadastradas, tipos de acesso e situação dos usuários.',
    icon: Users,
    includedItems: [
      'Pacientes, médicos e administradores',
      'Status das contas',
      'Datas de cadastro e último acesso',
    ],
  },
  {
    type: 'crisis',
    title: 'Relatório de acompanhamento',
    description:
      'Consolida indicadores de acompanhamento, níveis de atenção e registros relevantes dos pacientes.',
    icon: HeartPulse,
    includedItems: [
      'Volume de registros de acompanhamento',
      'Médias de fadiga, sono, rigidez, humor e estresse',
      'Destaques observados nos registros recentes',
    ],
  },
  {
    type: 'analytics',
    title: 'Relatório analítico',
    description:
      'Apresenta padrões, gatilhos, tendências e indicadores consolidados da plataforma.',
    icon: TrendingUp,
    includedItems: [
      'Padrões mais recorrentes',
      'Volume recente de registros',
      'Indicadores agregados da plataforma',
    ],
  },
]

function generateReportId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `report-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function readStoredHistory(): AdminReportHistoryItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.sessionStorage.getItem(REPORT_HISTORY_STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue) as AdminReportHistoryItem[]
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

function persistHistory(history: AdminReportHistoryItem[]) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(
      REPORT_HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(0, REPORT_HISTORY_LIMIT)),
    )
  } catch {
    // Ignore storage quota issues and keep working in memory.
  }
}

function formatDateTimeValue(value?: string | null): string {
  if (!value) {
    return 'Nenhum ainda'
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

  return `${datePart} às ${timePart}`
}

function resolveGenerateErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Tente novamente em alguns instantes.'
}

function isInsidePeriod(
  generatedAt: string,
  period: HistoryPeriodFilter,
): boolean {
  if (period === 'all') {
    return true
  }

  const generatedTime = new Date(generatedAt).getTime()
  const days = Number(period)
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000

  return generatedTime >= cutoff
}

async function fetchAllUsers(): Promise<AdminUser[]> {
  const collectedUsers: AdminUser[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const response = await adminService.getUsers({
      page,
      limit: PAGE_SIZE,
    })

    collectedUsers.push(...response.items)
    totalPages = response.meta.totalPages
    page += 1
  }

  return collectedUsers
}

async function fetchAllSymptoms(): Promise<AdminSymptomRecord[]> {
  const collectedSymptoms: AdminSymptomRecord[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const response = await adminService.getSymptoms({
      page,
      limit: PAGE_SIZE,
    })

    collectedSymptoms.push(...response.items)
    totalPages = response.meta.totalPages
    page += 1
  }

  return collectedSymptoms
}

function OverviewCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="card-surface p-5">
      <p className="section-label">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </div>
  )
}

function ReportCatalogCard({
  title,
  description,
  icon: Icon,
  includedItems,
  isGenerating,
  isDisabled,
  onGeneratePdf,
  onGenerateJson,
}: {
  title: string
  description: string
  icon: typeof Users
  includedItems: string[]
  isGenerating: boolean
  isDisabled: boolean
  onGeneratePdf: () => void
  onGenerateJson: () => void
}) {
  return (
    <article className="card-surface flex h-full flex-col p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 shadow-soft">
        <Icon className="h-5 w-5" />
      </div>

      <div className="mt-5 space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/90">
          Informações incluídas
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {includedItems.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-[0.45rem] h-1.5 w-1.5 rounded-full bg-brand-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
        <Button
          className="sm:flex-1"
          onClick={onGeneratePdf}
          disabled={isDisabled}
        >
          {isGenerating ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Gerando relatório...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Gerar PDF
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          className="sm:flex-1"
          onClick={onGenerateJson}
          disabled={isDisabled}
        >
          {isGenerating ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Gerando relatório...
            </>
          ) : (
            <>
              <FileJson className="h-4 w-4" />
              Exportar JSON
            </>
          )}
        </Button>
      </div>
    </article>
  )
}

export function AdminReportsPage() {
  usePageTitle('Relatórios Administrativos')

  const authSession = useAppStore((state) => state.authSession)
  const [reports, setReports] = useState<AdminReportHistoryItem[]>(() =>
    readStoredHistory(),
  )
  const [generatingReportKey, setGeneratingReportKey] = useState<string | null>(null)
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<HistoryTypeFilter>('all')
  const [formatFilter, setFormatFilter] = useState<HistoryFormatFilter>('all')
  const [periodFilter, setPeriodFilter] = useState<HistoryPeriodFilter>('all')
  const [searchValue, setSearchValue] = useState('')

  const generatedBy =
    authSession?.user.fullName?.trim() || authSession?.user.email || 'Administrador'

  const latestReport = reports[0] ?? null
  const reportsLast30Days = reports.filter((report) =>
    isInsidePeriod(report.generatedAt, '30'),
  ).length
  const hasFilterControls = reports.length >= 3
  const hasSearch = reports.length >= 5

  const filteredReports = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(searchValue)

    return reports.filter((report) => {
      const matchesType = typeFilter === 'all' || report.type === typeFilter
      const matchesFormat =
        formatFilter === 'all' || report.format === formatFilter
      const matchesPeriod = isInsidePeriod(report.generatedAt, periodFilter)
      const matchesSearch = normalizedSearch
        ? normalizeSearchValue(
            `${report.name} ${report.fileName} ${report.generatedBy ?? ''}`,
          ).includes(normalizedSearch)
        : true

      return matchesType && matchesFormat && matchesPeriod && matchesSearch
    })
  }, [formatFilter, periodFilter, reports, searchValue, typeFilter])

  async function handleGenerateReport(
    type: AdminReport['type'],
    format: AdminReport['format'],
  ) {
    if (generatingReportKey) {
      return
    }

    const nextKey = `${type}-${format}`
    setGeneratingReportKey(nextKey)

    try {
      const generatedAt = new Date().toISOString()
      let artifacts:
        | ReturnType<typeof createUsersReportArtifacts>
        | ReturnType<typeof createFollowUpReportArtifacts>
        | ReturnType<typeof createAnalyticsReportArtifacts>

      if (type === 'users') {
        const users = await fetchAllUsers()
        artifacts = createUsersReportArtifacts(users, generatedAt, generatedBy)
      } else if (type === 'crisis') {
        const symptoms = await fetchAllSymptoms()
        artifacts = createFollowUpReportArtifacts(
          symptoms,
          generatedAt,
          generatedBy,
        )
      } else {
        const [users, symptoms] = await Promise.all([
          fetchAllUsers(),
          fetchAllSymptoms(),
        ])
        artifacts = createAnalyticsReportArtifacts(
          users,
          symptoms,
          generatedAt,
          generatedBy,
        )
      }

      const newReport: AdminReportHistoryItem = {
        id: generateReportId(),
        name: artifacts.name,
        type,
        generatedAt,
        format,
        fileName: buildAdminReportFileName(type, format, generatedAt),
        generatedBy,
        document: artifacts.document,
        payload: artifacts.payload,
      }

      const nextReports = [newReport, ...reports].slice(0, REPORT_HISTORY_LIMIT)

      setReports(nextReports)
      persistHistory(nextReports)
      downloadBlob(createDownloadBlob(newReport), newReport.fileName)
      toast.success('Relatório gerado', 'O arquivo está pronto para download.')
    } catch (error) {
      toast.error(
        'Não foi possível gerar o relatório',
        resolveGenerateErrorMessage(error),
      )
    } finally {
      setGeneratingReportKey(null)
    }
  }

  function handleDownloadReport(reportId: string) {
    const report = reports.find((item) => item.id === reportId)

    if (!report) {
      toast.error(
        'Não foi possível baixar o relatório',
        'O item selecionado não está mais disponível.',
      )
      return
    }

    try {
      setDownloadingReportId(reportId)
      downloadBlob(createDownloadBlob(report), report.fileName)
    } catch (error) {
      toast.error(
        'Não foi possível baixar o relatório',
        resolveGenerateErrorMessage(error),
      )
    } finally {
      setDownloadingReportId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relatórios"
        title="Relatórios administrativos"
        description="Gere, consulte e exporte informações consolidadas da plataforma."
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Visão geral</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe rapidamente o volume e o histórico dos relatórios gerados.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            label="Relatórios gerados"
            value={String(reports.length)}
            helper="Quantidade de relatórios administrativos disponíveis nesta sessão."
          />
          <OverviewCard
            label="Última geração"
            value={formatDateTimeValue(latestReport?.generatedAt)}
            helper="Data e horário do relatório mais recente."
          />
          <OverviewCard
            label="Formatos disponíveis"
            value="PDF e JSON"
            helper="Exportações prontas para leitura gerencial e integração técnica."
          />
          <OverviewCard
            label="Últimos 30 dias"
            value={String(reportsLast30Days)}
            helper="Relatórios gerados dentro da janela mais recente."
          />
        </div>
      </section>

      <AdminContentSection
        title="Gerar relatório"
        description="Escolha o conteúdo e o formato desejado."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {reportCatalog.map((reportType) => {
            const isPdfGenerating =
              generatingReportKey === `${reportType.type}-pdf`
            const isJsonGenerating =
              generatingReportKey === `${reportType.type}-json`

            return (
              <ReportCatalogCard
                key={reportType.type}
                title={reportType.title}
                description={reportType.description}
                icon={reportType.icon}
                includedItems={reportType.includedItems}
                isGenerating={isPdfGenerating || isJsonGenerating}
                isDisabled={Boolean(generatingReportKey)}
                onGeneratePdf={() =>
                  void handleGenerateReport(reportType.type, 'pdf')
                }
                onGenerateJson={() =>
                  void handleGenerateReport(reportType.type, 'json')
                }
              />
            )
          })}
        </div>
      </AdminContentSection>

      <AdminContentSection
        title="Histórico de relatórios"
        description="Consulte os relatórios gerados anteriormente."
      >
        <div className="space-y-5">
          {hasFilterControls ? (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(11rem,0.45fr))]">
              {hasSearch ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Buscar relatório
                  </label>
                  <Input
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Buscar relatório..."
                  />
                </div>
              ) : (
                <div className="rounded-[1.25rem] border border-white/70 bg-white/72 px-4 py-3 text-sm text-muted-foreground">
                  Filtre por tipo, formato e período para localizar exportações recentes.
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tipo
                </label>
                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(event.target.value as HistoryTypeFilter)
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="all">Todos</option>
                  <option value="users">Usuários</option>
                  <option value="crisis">Acompanhamento</option>
                  <option value="analytics">Analítico</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Formato
                </label>
                <select
                  value={formatFilter}
                  onChange={(event) =>
                    setFormatFilter(event.target.value as HistoryFormatFilter)
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="all">Todos</option>
                  <option value="pdf">PDF</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Período
                </label>
                <select
                  value={periodFilter}
                  onChange={(event) =>
                    setPeriodFilter(event.target.value as HistoryPeriodFilter)
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="all">Todos</option>
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                </select>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Badge variant="neutral">
              {filteredReports.length} item{filteredReports.length === 1 ? '' : 's'}
            </Badge>
            {hasFilterControls && typeFilter !== 'all' ? (
              <Badge variant="default">
                Tipo: {typeFilter === 'users' ? 'Usuários' : typeFilter === 'crisis' ? 'Acompanhamento' : 'Analítico'}
              </Badge>
            ) : null}
            {hasFilterControls && formatFilter !== 'all' ? (
              <Badge variant="default" className="uppercase">
                Formato: {formatFilter}
              </Badge>
            ) : null}
            {hasFilterControls && periodFilter !== 'all' ? (
              <Badge variant="default">
                Período: últimos {periodFilter} dias
              </Badge>
            ) : null}
          </div>

          <ReportsTable
            reports={filteredReports}
            downloadingReportId={downloadingReportId}
            onDownload={handleDownloadReport}
          />
        </div>
      </AdminContentSection>
    </div>
  )
}
