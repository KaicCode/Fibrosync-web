import { Loader } from 'lucide-react'

type ContentSectionProps = {
  title: string
  description?: string
  children: React.ReactNode
  isLoading?: boolean
}

export function AdminContentSection({
  title,
  description,
  children,
  isLoading,
}: ContentSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>

      <div className="card-surface p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
