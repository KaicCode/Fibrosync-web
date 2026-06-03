import brandLogo from '@/assets/logofibrosync (1).png'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  compact?: boolean
  className?: string
}

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(123,77,255,0.2),transparent_72%)] blur-xl" />
        <img
          src={brandLogo}
          alt="Logo FibroSync"
          className="relative h-full w-full object-contain drop-shadow-[0_20px_34px_rgba(123,77,255,0.18)]"
        />
      </div>
      {!compact && (
        <div>
          <p className="text-lg font-semibold tracking-[-0.05em] text-foreground">
            Fibro<span className="gradient-text">Sync</span>
          </p>
          <p className="text-xs text-muted-foreground">Cuidado conectado com leveza</p>
        </div>
      )}
    </div>
  )
}
