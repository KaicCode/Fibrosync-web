import { RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'

/**
 * Small banner driven by the service worker lifecycle:
 * - `offlineReady`: the app has finished precaching and can now run offline.
 * - `needRefresh`: a new version was deployed and precached in the
 *   background; reloading swaps in the new service worker.
 */
export function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!offlineReady && !needRefresh) {
    return null
  }

  function close() {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-3 px-4 sm:items-end">
      <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-[1.35rem] border border-violet-200/80 bg-white/96 shadow-[0_20px_44px_rgba(124,58,237,0.16)] backdrop-blur">
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <RefreshCw className="h-4.5 w-4.5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {needRefresh
                ? 'Uma nova versão do FibroSync está disponível.'
                : 'FibroSync pronto para uso offline.'}
            </p>
            {needRefresh ? (
              <div className="mt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => updateServiceWorker(true)}
                >
                  Atualizar agora
                </Button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={close}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar notificação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
