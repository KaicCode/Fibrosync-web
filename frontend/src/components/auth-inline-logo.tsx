import inlineLogo from '@/assets/logofibrosync (1).png'
import { cn } from '@/lib/utils'

type AuthInlineLogoProps = {
  className?: string
}

export function AuthInlineLogo({ className }: AuthInlineLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex h-12 w-12 items-center justify-center md:h-14 md:w-14">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(123,77,255,0.2),transparent_72%)] blur-xl" />
        <img
          src={inlineLogo}
          alt="Logo FibroSync"
          className="relative h-full w-full object-contain drop-shadow-[0_20px_34px_rgba(123,77,255,0.18)]"
        />
      </div>

      <h1 className="text-[2.35rem] font-semibold leading-none tracking-[-0.08em] md:text-[2.7rem]">
        <span className="text-[#18204B]">Fibro</span>
        <span className="bg-[linear-gradient(135deg,#5D5BFF_0%,#249BFF_72%,#11B5C9_100%)] bg-clip-text text-transparent">
          Sync
        </span>
      </h1>
    </div>
  )
}
