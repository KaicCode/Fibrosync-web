import { AlertTriangle } from 'lucide-react'

type AlertCardProps = {
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  action?: {
    label: string
    onClick: () => void
  }
}

const typeStyles = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
}

export function AdminAlertCard({ title, message, type, action }: AlertCardProps) {
  return (
    <div className={`border rounded-lg p-4 ${typeStyles[type]}`}>
      <div className="flex items-start gap-3">
        {type === 'warning' && <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-sm mb-3">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="text-sm font-semibold hover:underline"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
