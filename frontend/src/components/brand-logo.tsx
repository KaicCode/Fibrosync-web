import { cn } from '@/lib/utils'

type BrandLogoProps = {
  compact?: boolean
  className?: string
}

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-white/90 shadow-soft">
        <div className="absolute inset-[6px] rounded-[1rem] bg-brand-gradient opacity-90" />
        <svg
          viewBox="0 0 48 48"
          className="relative h-8 w-8 text-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.18)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 25.5H14L18 18L23 31L28 14L32 25.5H41"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 43C33.3888 43 41 35.3888 41 26C41 16.6112 33.3888 9 24 9C14.6112 9 7 16.6112 7 26C7 35.3888 14.6112 43 24 43Z"
            stroke="currentColor"
            strokeOpacity="0.78"
            strokeWidth="2.4"
          />
        </svg>
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
