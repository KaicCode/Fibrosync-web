import { AppErrorBoundary } from '@/components/app-error-boundary'
import { OfflineScreen } from '@/components/offline-screen'
import { PwaUpdatePrompt } from '@/components/pwa/pwa-update-prompt'
import { Toaster } from '@/components/ui/toaster'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { AppRouter } from '@/routes'
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/react'

function sanitizeAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(event.url)

  if (/^\/medical\/patients\/[^/]+\/?$/.test(url.pathname)) {
    return null
  }

  url.search = ''
  url.hash = ''

  return {
    ...event,
    url: url.toString(),
  }
}

function App() {
  const isOnline = useOnlineStatus()

  return (
    <>
      <AppErrorBoundary>
        {isOnline ? <AppRouter /> : <OfflineScreen />}
        <Toaster />
        <PwaUpdatePrompt />
      </AppErrorBoundary>
      <Analytics beforeSend={sanitizeAnalyticsEvent} />
    </>
  )
}

export default App
