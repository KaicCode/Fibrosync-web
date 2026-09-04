import { AppErrorBoundary } from '@/components/app-error-boundary'
import { OfflineScreen } from '@/components/offline-screen'
import { PwaUpdatePrompt } from '@/components/pwa/pwa-update-prompt'
import { Toaster } from '@/components/ui/toaster'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { AppRouter } from '@/routes'

function App() {
  const isOnline = useOnlineStatus()

  return (
    <AppErrorBoundary>
      {isOnline ? <AppRouter /> : <OfflineScreen />}
      <Toaster />
      <PwaUpdatePrompt />
    </AppErrorBoundary>
  )
}

export default App
