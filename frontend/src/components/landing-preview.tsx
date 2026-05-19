import { HeartPulse, MoonStar, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const cards = [
  {
    title: 'Nível de dor',
    value: '5,4',
    hint: 'Moderado',
    Icon: HeartPulse,
  },
  {
    title: 'Sono',
    value: '7h 20m',
    hint: 'Boa recuperação',
    Icon: MoonStar,
  },
  {
    title: 'Insight IA',
    value: '3 padrões',
    hint: 'Detectados nesta semana',
    Icon: Sparkles,
  },
]

export function LandingPreview() {
  return (
    <div className="relative flex min-h-[26rem] items-center justify-center">
      <div className="absolute inset-x-10 top-14 h-48 rounded-full bg-brand-300/20 blur-3xl" />
      <div className="absolute inset-x-16 bottom-8 h-40 rounded-full bg-sky-300/15 blur-3xl" />
      <div className="relative grid w-full max-w-[34rem] gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="panel-surface row-span-2 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-label">Dashboard</p>
              <h3 className="mt-2 text-xl font-semibold">Sua energia hoje</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <HeartPulse className="h-5 w-5" />
            </div>
          </div>
          <div className="rounded-[1.6rem] border border-brand-100/70 bg-brand-50/70 p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Variação da dor</p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.07em] text-brand-700">
                  6
                </p>
              </div>
              <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-brand-600">
                estável
              </p>
            </div>
            <div className="mt-5 flex h-24 items-end gap-2">
              {[28, 32, 30, 44, 40, 52, 48].map((height, index) => (
                <div key={height} className="flex flex-1 flex-col justify-end">
                  <motion.div
                    className="rounded-full bg-brand-gradient"
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{ delay: index * 0.08, duration: 0.55 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.12 * index }}
            className="card-surface p-5"
          >
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <card.Icon className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted-foreground">{card.title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">
              {card.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{card.hint}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
