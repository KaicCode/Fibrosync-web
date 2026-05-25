import { Download, Loader } from 'lucide-react'
import type { AdminReport } from '@/types/admin'

type ReportsTableProps = {
  reports: AdminReport[]
  isLoading?: boolean
  onDownload?: (reportId: string) => void
}

const typeLabels = {
  users: 'Usuários',
  crisis: 'Crises',
  analytics: 'Análiticos',
}

export function ReportsTable({ reports, isLoading, onDownload }: ReportsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-semibold text-foreground">Nome</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Tipo</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Formato</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Data</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Ações</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-b border-border hover:bg-muted/50">
              <td className="px-4 py-3 font-medium text-foreground">{report.name}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {typeLabels[report.type]}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 uppercase">
                  {report.format}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(report.generatedAt).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDownload?.(report.id)}
                  className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  disabled={!report.url}
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {reports.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum relatório gerado ainda.
        </div>
      )}
    </div>
  )
}
