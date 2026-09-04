import { Smartphone } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { InstallPwaModal } from './install-pwa-modal'

/**
 * Optional dashboard card inviting the patient to install the PWA. Renders
 * nothing once installed/standalone or when no install path is available.
 */
export function InstallPwaCard() {
  const { shouldShowInstallAffordance, isIos, promptInstall } = usePwaInstall()
  const [iosModalOpen, setIosModalOpen] = useState(false)

  if (!shouldShowInstallAffordance) {
    return null
  }

  async function handleClick() {
    if (isIos) {
      setIosModalOpen(true)
      return
    }

    await promptInstall()
  }

  return (
    <div className="flex items-center gap-4 rounded-[1.75rem] border border-white/70 bg-[linear-gradient(135deg,rgba(123,77,255,0.1),rgba(92,135,255,0.08))] p-5 shadow-soft">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
        <Smartphone className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold tracking-[-0.02em] text-foreground">
          Tenha o FibroSync sempre com você
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Instale o aplicativo no seu celular para acessar de forma mais rápida.
        </p>
      </div>
      <Button type="button" size="sm" onClick={handleClick} className="shrink-0">
        Instalar agora
      </Button>

      <InstallPwaModal open={iosModalOpen} onOpenChange={setIosModalOpen} />
    </div>
  )
}
