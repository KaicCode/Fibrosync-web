import { Skeleton } from '@/components/ui/skeleton'

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
          <div className="space-y-4 py-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-52 w-full rounded-[1.25rem]" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
