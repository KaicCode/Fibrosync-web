import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type PointId = 'ombros' | 'lombar' | 'quadril' | 'joelhos' | 'punhos' | 'cervical'

type BodyMapProps = {
  selectedPoints: string[]
  onTogglePoint?: (point: PointId) => void
}

const frontPoints: Array<{ id: PointId; x: number; y: number }> = [
  { id: 'cervical', x: 74, y: 58 },
  { id: 'ombros', x: 50, y: 92 },
  { id: 'ombros', x: 98, y: 92 },
  { id: 'lombar', x: 74, y: 142 },
  { id: 'quadril', x: 74, y: 176 },
  { id: 'joelhos', x: 60, y: 224 },
  { id: 'joelhos', x: 88, y: 224 },
]

const backPoints: Array<{ id: PointId; x: number; y: number }> = [
  { id: 'cervical', x: 74, y: 58 },
  { id: 'ombros', x: 47, y: 98 },
  { id: 'ombros', x: 101, y: 98 },
  { id: 'lombar', x: 74, y: 152 },
  { id: 'quadril', x: 74, y: 184 },
  { id: 'punhos', x: 36, y: 160 },
  { id: 'punhos', x: 112, y: 160 },
]

function Figure({
  points,
  selectedPoints,
  onTogglePoint,
}: {
  points: Array<{ id: PointId; x: number; y: number }>
  selectedPoints: string[]
  onTogglePoint?: (point: PointId) => void
}) {
  return (
    <svg viewBox="0 0 148 268" className="h-full w-full">
      <circle cx="74" cy="26" r="15" stroke="#C9C3DB" strokeWidth="2.2" fill="white" />
      <path
        d="M74 42C74 42 69 56 69 72C61 81 55 91 53 106C49 129 47 138 43 154C41 163 44 169 51 170C56 171 61 166 62 160L66 138L67 175L60 241C59 249 64 256 71 256C79 256 83 250 84 241L89 190L94 241C95 250 100 256 108 256C115 256 120 249 119 241L112 175L113 138L117 160C118 166 123 171 128 170C135 169 138 163 136 154C132 138 130 129 126 106C123 91 117 81 109 72C109 56 104 42 104 42"
        stroke="#C9C3DB"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M53 106L30 145M95 106L118 145M60 83L40 95M88 83L108 95"
        stroke="#C9C3DB"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {points.map((point, index) => {
        const active = selectedPoints.includes(point.id)

        return (
          <g key={`${point.id}-${index}`}>
            {active ? (
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="15"
                fill="#CDAEFF"
                fillOpacity="0.35"
                animate={{ opacity: [0.25, 0.52, 0.25], scale: [0.95, 1.06, 0.95] }}
                transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY }}
              />
            ) : null}
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill={active ? '#9B73FF' : '#E7DFFF'}
              fillOpacity={active ? 1 : 0.68}
              className={cn(onTogglePoint ? 'cursor-pointer' : '')}
              onClick={() => onTogglePoint?.(point.id)}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill="white"
              className={cn(onTogglePoint ? 'cursor-pointer' : '')}
              onClick={() => onTogglePoint?.(point.id)}
            />
          </g>
        )
      })}
    </svg>
  )
}

export function BodyMap({ selectedPoints, onTogglePoint }: BodyMapProps) {
  return (
    <div className="grid gap-6 rounded-[1.8rem] border border-white/80 bg-white/84 p-5 shadow-soft lg:grid-cols-2">
      <div className="rounded-[1.5rem] bg-brand-50/30 p-3">
        <Figure points={frontPoints} selectedPoints={selectedPoints} onTogglePoint={onTogglePoint} />
      </div>
      <div className="rounded-[1.5rem] bg-brand-50/20 p-3">
        <Figure points={backPoints} selectedPoints={selectedPoints} onTogglePoint={onTogglePoint} />
      </div>
    </div>
  )
}
