import { Download } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { InstallPwaModal } from './install-pwa-modal'

type InstallPwaButtonProps = {
  className?: string
  variant?: 'default' | 'compact'
}

/**
 * "Instalar FibroSync" affordance. Renders nothing once the app is already
 * installed/running standalone, or on a browser that offers no install path
 * (no `beforeinstallprompt` and not iOS).
 */
export function InstallPwaButton({ className, variant = 'default' }: InstallPwaButtonProps) {
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            className={cn('shrink-0', className)}
          >
            <Download className="h-4 w-4" />
            <span className={variant === 'compact' ? 'hidden sm:inline' : undefined}>
              Instalar FibroSync
            </span>
            {variant === 'compact' ? (
              <span className="sm:hidden">Instalar app</span>
            ) : null}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Instale o FibroSync neste dispositivo</TooltipContent>
      </Tooltip>

      <InstallPwaModal open={iosModalOpen} onOpenChange={setIosModalOpen} />
    </TooltipProvider>
  )
}
