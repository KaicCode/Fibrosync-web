import { AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react'
import type { CrisisAlert } from '@/types/admin'

type CrisisAlertsTableProps = {
  alerts: CrisisAlert[]
  isLoading?: boolean
}

const riskLevelConfig = {
  low: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Baixo' },
  medium: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Médio' },
  high: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Alto' },
  critical: { icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50', label: 'Crítico' },
}

export function CrisisAlertsTable({ alerts, isLoading }: CrisisAlertsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-semibold text-foreground">Usuário</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Nível de Risco</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Gatilho</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => {
            const config = riskLevelConfig[alert.riskLevel]
            const Icon = config.icon

            return (
              <tr key={alert.id} className={`border-b border-border ${config.bg}`}>
                <td className="px-4 py-3 font-medium text-foreground">{alert.userName}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className={config.color}>{config.label}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{alert.trigger}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleString('pt-BR')}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {alerts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum alerta de crise encontrado.
        </div>
      )}
    </div>
  )
}
