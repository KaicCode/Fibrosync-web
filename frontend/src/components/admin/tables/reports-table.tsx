import { Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { resolveAdminReportTypeLabel } from '@/lib/admin-report-export'
import type { AdminReportHistoryItem } from '@/types/admin'

type ReportsTableProps = {
  reports: AdminReportHistoryItem[]
  isLoading?: boolean
  downloadingReportId?: string | null
  onDownload?: (reportId: string) => void
}

function formatGeneratedAt(value: string): string {
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

function FormatBadge({ format }: { format: AdminReportHistoryItem['format'] }) {
  return (
    <Badge variant="neutral" className="uppercase">
      {format}
    </Badge>
  )
}

function DownloadAction({
  report,
  downloadingReportId,
  onDownload,
}: {
  report: AdminReportHistoryItem
  downloadingReportId?: string | null
  onDownload?: (reportId: string) => void
}) {
  const isDownloading = downloadingReportId === report.id

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDownload?.(report.id)}
          disabled={isDownloading}
        >
          <Download className="h-4 w-4" />
          {isDownloading ? 'Baixando...' : 'Baixar'}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Baixar relatório</TooltipContent>
    </Tooltip>
  )
}

export function ReportsTable({
  reports,
  isLoading,
  downloadingReportId,
  onDownload,
}: ReportsTableProps) {
  const showGeneratedBy = reports.some((report) => Boolean(report.generatedBy))

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-[1.4rem] bg-muted"
          />
        ))}
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          Nenhum relatório gerado ainda
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Os relatórios que você gerar aparecerão aqui.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Gere seu primeiro relatório usando uma das opções acima.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="space-y-3 md:hidden">
          {reports.map((report) => (
            <article
              key={report.id}
              className="rounded-[1.45rem] border border-white/75 bg-white/86 p-4 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {report.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatGeneratedAt(report.generatedAt)}
                  </p>
                </div>

                <DownloadAction
                  report={report}
                  downloadingReportId={downloadingReportId}
                  onDownload={onDownload}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="default">
                  {resolveAdminReportTypeLabel(report.type)}
                </Badge>
                <FormatBadge format={report.format} />
              </div>

              {report.generatedBy ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Gerado por {report.generatedBy}
                </p>
              ) : null}
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Relatório
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Formato
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Gerado em
                </th>
                {showGeneratedBy ? (
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Gerado por
                  </th>
                ) : null}
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-border/80 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-4 align-top">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{report.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {report.fileName}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge variant="default">
                      {resolveAdminReportTypeLabel(report.type)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <FormatBadge format={report.format} />
                  </td>
                  <td className="px-4 py-4 align-top text-muted-foreground">
                    {formatGeneratedAt(report.generatedAt)}
                  </td>
                  {showGeneratedBy ? (
                    <td className="px-4 py-4 align-top text-muted-foreground">
                      {report.generatedBy || '—'}
                    </td>
                  ) : null}
                  <td className="px-4 py-4 align-top">
                    <DownloadAction
                      report={report}
                      downloadingReportId={downloadingReportId}
                      onDownload={onDownload}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  )
}
