import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToastStore, type ToastItem } from '@/store/toast-store'

const toneStyles: Record<
  ToastItem['tone'],
  {
    card: string
    icon: string
    iconNode: typeof CheckCircle2
  }
> = {
  success: {
    card:
      'border-emerald-200/80 bg-white/96 text-slate-900 shadow-[0_20px_44px_rgba(16,185,129,0.16)]',
    icon: 'bg-emerald-50 text-emerald-600',
    iconNode: CheckCircle2,
  },
  error: {
    card:
      'border-rose-200/80 bg-white/96 text-slate-900 shadow-[0_20px_44px_rgba(244,63,94,0.16)]',
    icon: 'bg-rose-50 text-rose-600',
    iconNode: TriangleAlert,
  },
  info: {
    card:
      'border-violet-200/80 bg-white/96 text-slate-900 shadow-[0_20px_44px_rgba(124,58,237,0.16)]',
    icon: 'bg-violet-50 text-violet-600',
    iconNode: Info,
  },
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex flex-col items-center gap-3 px-4 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const tone = toneStyles[toast.tone]
          const Icon = tone.iconNode

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={cn(
                'pointer-events-auto w-full max-w-sm overflow-hidden rounded-[1.35rem] border backdrop-blur',
                tone.card,
              )}
              role={toast.tone === 'error' ? 'alert' : 'status'}
            >
              <div className="flex items-start gap-3 p-4">
                <div
                  className={cn(
                    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                    tone.icon,
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {toast.title}
                  </p>
                  {toast.description ? (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {toast.description}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Fechar notificacao"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
