import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled FibroSync render error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/80 bg-white/92 p-8 text-center shadow-panel backdrop-blur-xl">
          <p className="section-label">FibroSync</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Algo saiu do fluxo esperado
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A aplicacao encontrou uma falha inesperada, mas seus dados de sessao
            podem ser recuperados com segurança.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={this.handleReload}>Recarregar agora</Button>
            <Button asChild variant="secondary">
              <Link to="/login">Voltar ao login</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
