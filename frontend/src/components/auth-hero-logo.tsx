import { cn } from '@/lib/utils'

type AuthHeroLogoProps = {
  className?: string
}

export function AuthHeroLogo({ className }: AuthHeroLogoProps) {
  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <div className="relative flex h-40 w-40 items-center justify-center md:h-48 md:w-48">
        <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle,rgba(123,77,255,0.18),transparent_68%)] blur-2xl" />
        <svg
          viewBox="0 0 220 220"
          className="relative h-full w-full drop-shadow-[0_24px_48px_rgba(123,77,255,0.18)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="fs-ring" x1="33" y1="168" x2="184" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#09C5D5" />
              <stop offset="0.52" stopColor="#2563EB" />
              <stop offset="1" stopColor="#D946EF" />
            </linearGradient>
            <linearGradient id="fs-brain" x1="67" y1="68" x2="153" y2="154" gradientUnits="userSpaceOnUse">
              <stop stopColor="#14B8FF" />
              <stop offset="0.42" stopColor="#3446C9" />
              <stop offset="1" stopColor="#7E22CE" />
            </linearGradient>
          </defs>

          <circle cx="110" cy="110" r="82" stroke="url(#fs-ring)" strokeWidth="10" />
          <path
            d="M175 50C193 63 204 84 204 108C204 135 191 159 171 173"
            stroke="#B455FF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="5 7"
          />
          <path
            d="M42 164C28 150 19 130 19 108C19 82 31 58 50 43"
            stroke="#80CBFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="5 7"
          />

          {[
            { cx: 24, cy: 104, r: 7, fill: '#22D3EE' },
            { cx: 26, cy: 86, r: 5.5, fill: '#56C4FF' },
            { cx: 31, cy: 68, r: 4.5, fill: '#60A5FA' },
            { cx: 189, cy: 46, r: 9, fill: '#E879F9' },
            { cx: 176, cy: 39, r: 5, fill: '#C084FC' },
            { cx: 200, cy: 58, r: 6, fill: '#D946EF' },
            { cx: 183, cy: 173, r: 4, fill: '#7C3AED' },
          ].map((dot, index) => (
            <circle key={index} {...dot} opacity="0.95" />
          ))}

          <path
            d="M67 92C67 72 83 57 103 57C114 57 124 61 131 67C136 64 142 63 149 63C170 63 186 79 186 100C186 115 178 129 165 136C164 157 147 174 126 174C113 174 101 167 93 157C88 159 83 160 77 160C57 160 41 144 41 124C41 109 49 97 61 91C63 91 65 91 67 92Z"
            fill="url(#fs-brain)"
          />
          <path
            d="M46 111H76L92 97L108 131L127 76L143 111H175"
            stroke="white"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M88 69C94 71 100 75 103 81M76 77C82 79 87 83 90 88M136 74C144 77 149 83 151 89"
            stroke="white"
            strokeOpacity="0.22"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="mt-2">
        <h1 className="text-[3.25rem] font-semibold leading-none tracking-[-0.08em] md:text-[4.5rem]">
          <span className="bg-[linear-gradient(135deg,#7D2ADF_0%,#7D2ADF_36%,#2196F3_72%,#10B5C9_100%)] bg-clip-text text-transparent">
            FibroSync
          </span>
        </h1>
        <p className="mt-4 max-w-md text-balance text-[1.55rem] font-normal tracking-[-0.03em] text-slate-500 md:text-[2.05rem]">
          Sincronizando cuidado e qualidade de vida.
        </p>
      </div>
    </div>
  )
}
