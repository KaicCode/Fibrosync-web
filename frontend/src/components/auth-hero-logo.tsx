import heroLogo from '@/assets/logofibrosync (1).png'
import { cn } from '@/lib/utils'

type AuthHeroLogoProps = {
  className?: string
}

export function AuthHeroLogo({ className }: AuthHeroLogoProps) {
  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <div className="relative flex h-28 w-28 items-center justify-center md:h-36 md:w-36">
        <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle,rgba(123,77,255,0.18),transparent_68%)] blur-2xl" />
        <img
          src={heroLogo}
          alt="Logo FibroSync"
          className="relative h-full w-full object-contain drop-shadow-[0_24px_48px_rgba(123,77,255,0.18)]"
        />
      </div>

      <div className="mt-2">
        <h1 className="text-[2.45rem] font-semibold leading-none tracking-[-0.08em] md:text-[3.3rem]">
          <span className="bg-[linear-gradient(135deg,#7D2ADF_0%,#7D2ADF_36%,#2196F3_72%,#10B5C9_100%)] bg-clip-text text-transparent">
            FibroSync
          </span>
        </h1>
        <p className="mt-3 max-w-sm text-balance text-lg font-normal tracking-[-0.03em] text-slate-500 md:text-[1.35rem]">
          Sincronizando cuidado e qualidade de vida.
        </p>
      </div>
    </div>
  )
}
