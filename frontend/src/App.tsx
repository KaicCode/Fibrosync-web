import { AppErrorBoundary } from '@/components/app-error-boundary'
import { Toaster } from '@/components/ui/toaster'
import { AppRouter } from '@/routes'

function App() {
  return (
    <AppErrorBoundary>
      <AppRouter />
      <Toaster />
    </AppErrorBoundary>
  )
}

export default App
