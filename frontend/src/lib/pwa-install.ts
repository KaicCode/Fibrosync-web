// Module-level singleton: the `beforeinstallprompt` event can only be
// captured once per page load (and can only be prompted once), so it is
// captured here — outside React — the moment this module is first
// evaluated, and every `usePwaInstall()` call site shares the same state
// instead of each mounting its own listener.

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt: () => Promise<void>
}

type Listener = () => void

interface PwaInstallState {
  deferredPrompt: BeforeInstallPromptEvent | null
  isInstalled: boolean
}

function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const isDisplayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  // Legacy iOS Safari flag for "added to home screen".
  const isIosStandalone = (window.navigator as { standalone?: boolean }).standalone === true

  return isDisplayModeStandalone || isIosStandalone
}

const state: PwaInstallState = {
  deferredPrompt: null,
  isInstalled: isStandaloneDisplayMode(),
}

const listeners = new Set<Listener>()

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const isIosUserAgent = /iPad|iPhone|iPod/.test(navigator.userAgent)
  // iPadOS 13+ reports as "MacIntel" with touch support, unlike real Macs.
  const isIpadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

  return isIosUserAgent || isIpadOs
}

interface PwaInstallSnapshot {
  canInstall: boolean
  isInstalled: boolean
  isIos: boolean
}

// `useSyncExternalStore` requires `getSnapshot` to return a referentially
// stable value when nothing has changed (it compares with `Object.is` on
// every render) — returning a fresh object literal each call causes an
// infinite render loop. This snapshot is only rebuilt when one of its
// underlying values actually changes.
const isIos = isIosDevice()
let cachedSnapshot: PwaInstallSnapshot = {
  canInstall: state.deferredPrompt !== null,
  isInstalled: state.isInstalled || isStandaloneDisplayMode(),
  isIos,
}

function refreshSnapshot(): void {
  const canInstall = state.deferredPrompt !== null
  const isInstalled = state.isInstalled || isStandaloneDisplayMode()

  if (canInstall !== cachedSnapshot.canInstall || isInstalled !== cachedSnapshot.isInstalled) {
    cachedSnapshot = { canInstall, isInstalled, isIos }
  }
}

function notify(): void {
  refreshSnapshot()

  for (const listener of listeners) {
    listener()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    state.deferredPrompt = event as BeforeInstallPromptEvent
    notify()
  })

  window.addEventListener('appinstalled', () => {
    state.deferredPrompt = null
    state.isInstalled = true
    notify()
  })
}

export function getPwaInstallSnapshot(): PwaInstallSnapshot {
  return cachedSnapshot
}

export function subscribeToPwaInstall(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function promptPwaInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const prompt = state.deferredPrompt

  if (!prompt) {
    return 'unavailable'
  }

  // A given prompt instance can only be used once — clear it immediately
  // regardless of outcome so the button doesn't try to reuse a stale event.
  state.deferredPrompt = null
  notify()

  await prompt.prompt()
  const { outcome } = await prompt.userChoice

  if (outcome === 'accepted') {
    state.isInstalled = true
    notify()
  }

  return outcome
}
