import { useState } from 'react'
import { FileJson, Loader } from 'lucide-react'
import { ReportsTable } from '@/components/admin/tables/reports-table'
import { AdminContentSection } from '@/components/admin/cards/content-section'
import { AdminAlertCard } from '@/components/admin/cards/alert-card'
import { PageHeader } from '@/components/page-header'
import { usePageTitle } from '@/hooks/use-page-title'
import * as adminService from '@/services/admin'
import type { AdminReport } from '@/types/admin'

export function AdminReportsPage() {
  usePageTitle('Relatórios')

  const [reports, setReports] = useState<AdminReport[]>([])
  const isLoading = false
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)

  // Mock reports data
  const mockReports: AdminReport[] = [
    {
      id: '1',
      name: 'Relatório de Usuários - Maio 2026',
      type: 'users',
      generatedAt: '2026-05-20T10:30:00Z',
      format: 'json',
      url: '#download-1',
    },
    {
      id: '2',
      name: 'Análise de Crises - Maio 2026',
      type: 'crisis',
      generatedAt: '2026-05-18T15:45:00Z',
      format: 'pdf',
      url: '#download-2',
    },
    {
      id: '3',
      name: 'Análiticos de Abril 2026',
      type: 'analytics',
      generatedAt: '2026-05-01T08:00:00Z',
      format: 'json',
      url: '#download-3',
    },
  ]

  const handleGenerateReport = async (type: 'users' | 'crisis' | 'analytics', format: 'json' | 'pdf') => {
    try {
      setGeneratingReport(`${type}-${format}`)
      // const newReport = await adminService.generateReport(type, format)
      // setReports([newReport, ...reports])

      // Mock: add generated report
      const newReport: AdminReport = {
        id: `new-${Date.now()}`,
        name: `Relatório ${type === 'users' ? 'de Usuários' : type === 'crisis' ? 'de Crises' : 'Analítico'} - ${new Date().toLocaleDateString('pt-BR')}`,
        type,
        generatedAt: new Date().toISOString(),
        format,
        url: '#',
      }
      setReports([newReport, ...mockReports])
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setGeneratingReport(null)
    }
  }

  const handleDownloadReport = async (reportId: string) => {
    try {
      const blob = await adminService.downloadReport(reportId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportId}.pdf`
      a.click()
    } catch (error) {
      console.error('Failed to download report:', error)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exportação"
        title="Gerar e baixar relatórios"
        description="Exporte dados do sistema em diferentes formatos"
      />

      {/* Alertas */}
      <AdminAlertCard
        type="info"
        title="Relatórios disponíveis"
        message="Você pode gerar relatórios de usuários, crises e análiticos nos formatos JSON e PDF."
      />

      {/* Seção de geração */}
      <AdminContentSection title="Gerar Novo Relatório" description="Selecione o tipo e formato do relatório">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Relatório de Usuários */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">Relatório de Usuários</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Lista completa de usuários, roles e status
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleGenerateReport('users', 'json')}
                disabled={generatingReport === 'users-json'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {generatingReport === 'users-json' ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileJson className="w-4 h-4" />
                    JSON
                  </>
                )}
              </button>
              <button
                onClick={() => handleGenerateReport('users', 'pdf')}
                disabled={generatingReport === 'users-pdf'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
              >
                {generatingReport === 'users-pdf' ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileJson className="w-4 h-4" />
                    PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Relatório de Crises */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">Relatório de Crises</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Análise de alertas e risco dos pacientes
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleGenerateReport('crisis', 'json')}
                disabled={generatingReport === 'crisis-json'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {generatingReport === 'crisis-json' ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileJson className="w-4 h-4" />
                    JSON
                  </>
                )}
              </button>
              <button
                onClick={() => handleGenerateReport('crisis', 'pdf')}
                disabled={generatingReport === 'crisis-pdf'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
              >
                {generatingReport === 'crisis-pdf' ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileJson className="w-4 h-4" />
                    PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Relatório Analítico */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">Relatório Analítico</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Análise de padrões, gatilhos e tendências
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleGenerateReport('analytics', 'json')}
                disabled={generatingReport === 'analytics-json'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {generatingReport === 'analytics-json' ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileJson className="w-4 h-4" />
                    JSON
                  </>
                )}
              </button>
              <button
                onClick={() => handleGenerateReport('analytics', 'pdf')}
                disabled={generatingReport === 'analytics-pdf'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
              >
                {generatingReport === 'analytics-pdf' ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileJson className="w-4 h-4" />
                    PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </AdminContentSection>

      {/* Histórico de relatórios */}
      <AdminContentSection
        title="Histórico de Relatórios"
        description={`${reports.length > 0 ? reports.length : 'Nenhum'} relatório${reports.length !== 1 ? 's' : ''} gerado${reports.length !== 1 ? 's' : ''}`}
        isLoading={isLoading}
      >
        <ReportsTable
          reports={reports.length > 0 ? reports : mockReports}
          isLoading={isLoading}
          onDownload={handleDownloadReport}
        />
      </AdminContentSection>
    </div>
  )
}
