import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OfflineScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/80 bg-white/92 p-8 text-center shadow-panel backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow">
          <WifiOff className="h-6 w-6" />
        </div>
        <p className="section-label">FibroSync</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-foreground">
          Você está sem conexão.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Algumas funcionalidades do FibroSync precisam de internet para
          carregar seus dados.
        </p>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    </div>
  )
}
