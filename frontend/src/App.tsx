import { AppErrorBoundary } from '@/components/app-error-boundary'
import { AppRouter } from '@/routes'

function App() {
  return (
    <AppErrorBoundary>
      <AppRouter />
    </AppErrorBoundary>
  )
}

export default App
