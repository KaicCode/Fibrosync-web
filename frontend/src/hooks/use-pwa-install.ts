import { useCallback, useSyncExternalStore } from 'react'
import {
  getPwaInstallSnapshot,
  promptPwaInstall,
  subscribeToPwaInstall,
} from '@/lib/pwa-install'

export interface UsePwaInstallResult {
  /** True only when the browser has offered a real install prompt to capture. */
  canInstall: boolean
  /** True when the app is already installed/running standalone (incl. iOS "Add to Home Screen"). */
  isInstalled: boolean
  /** True on iOS, where `beforeinstallprompt` never fires — show manual instructions instead. */
  isIos: boolean
  /**
   * Whether an install affordance should be shown at all: there's a real
   * prompt available, or we're on iOS and not already installed. Never true
   * once installed/standalone.
   */
  shouldShowInstallAffordance: boolean
  /** Triggers the native install prompt. Resolves to the outcome, or 'unavailable' if there's no captured prompt. */
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
}

export function usePwaInstall(): UsePwaInstallResult {
  const snapshot = useSyncExternalStore(subscribeToPwaInstall, getPwaInstallSnapshot, getPwaInstallSnapshot)

  const promptInstall = useCallback(() => promptPwaInstall(), [])

  const shouldShowInstallAffordance =
    !snapshot.isInstalled && (snapshot.canInstall || snapshot.isIos)

  return {
    canInstall: snapshot.canInstall,
    isInstalled: snapshot.isInstalled,
    isIos: snapshot.isIos,
    shouldShowInstallAffordance,
    promptInstall,
  }
}
