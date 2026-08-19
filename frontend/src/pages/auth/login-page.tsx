import { useState } from 'react'
import { Eye, LockKeyhole, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthHeroLogo } from '@/components/auth-hero-logo'
import { AppleIcon, GoogleIcon } from '@/components/provider-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePageTitle } from '@/hooks/use-page-title'
import { useAuth } from '@/hooks/useAuth'

function resolveLoginErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Nao foi possivel fazer login agora. Tente novamente.'
  }

  const normalizedMessage = error.message.toLowerCase()

  if (normalizedMessage.includes('invalid email or password')) {
    return 'Email ou senha incorretos.'
  }

  if (
    normalizedMessage.includes('demorou mais do que o esperado') ||
    normalizedMessage.includes('timeout')
  ) {
    return 'A autenticacao demorou demais para responder. Tente novamente.'
  }

  if (normalizedMessage.includes('nao foi possivel conectar com a api')) {
    return error.message
  }

  return error.message || 'Nao foi possivel fazer login agora. Tente novamente.'
}

export function LoginPage() {
  usePageTitle('Entrar')

  const navigate = useNavigate()
  const { login, isLoggingIn, loginError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoggingIn) {
      return
    }

    setSubmitErrorMessage(null)

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setSubmitErrorMessage(
        'Nao foi possivel conectar com a API. Verifique sua conexao e tente novamente.',
      )
      return
    }

    try {
      const session = await login({ email, password })
      navigate(session.user.role === 'ADMIN' ? '/admin/dashboard' : '/app', {
        replace: true,
      })
    } catch (error) {
      setSubmitErrorMessage(resolveLoginErrorMessage(error))
      console.error('Login failed:', error)
    }
  }

  const loginErrorMessage =
    submitErrorMessage ??
    (loginError ? resolveLoginErrorMessage(loginError) : null)

  return (
    <section className="relative flex min-h-[calc(100vh-2.5rem)] items-center justify-center overflow-hidden py-2 md:py-3">
      <div className="absolute left-[-12rem] top-[8%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(197,177,255,0.42),rgba(197,177,255,0.12),transparent_70%)]" />
      <div className="absolute bottom-[-8rem] right-[-7rem] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(207,188,255,0.32),rgba(207,188,255,0.1),transparent_72%)]" />
      <div className="absolute left-[18%] top-[19%] h-3 w-3 rounded-full bg-brand-300/80 blur-[1px]" />
      <div className="absolute right-[16%] top-[24%] h-4 w-4 rounded-full bg-brand-200/85 blur-[1px]" />
      <div className="absolute bottom-[15%] right-[23%] h-3 w-3 rounded-full bg-brand-200/70 blur-[1px]" />

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <div className="rounded-[2rem] border border-white/80 bg-white/82 px-4 py-6 shadow-[0_32px_84px_rgba(121,95,180,0.12)] backdrop-blur-xl md:px-8 md:py-8">
          <AuthHeroLogo />

          <div className="mx-auto mt-8 max-w-[27rem]">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold tracking-[-0.06em] text-slate-950 md:text-3xl">
                Bem-vindo(a) de volta! <span className="text-brand-500">💜</span>
              </h2>
              <p className="text-sm leading-6 text-slate-500 md:text-base">
                Faça login para continuar cuidando de você.
              </p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-500" />
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 rounded-[1.25rem] border-slate-200 bg-white/92 pl-14 pr-5 text-base text-slate-700 placeholder:text-slate-400"
                    placeholder="E-mail"
                  />
                </div>
              </label>

              <label className="block">
                <div className="relative">
                  <LockKeyhole className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-500" />
                  <Input
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 rounded-[1.25rem] border-slate-200 bg-white/92 pl-14 pr-14 text-base text-slate-700 placeholder:text-slate-400"
                    placeholder="Senha"
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-brand-500"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </label>

              {loginErrorMessage && (
                <div
                  className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
                  role="alert"
                >
                  {loginErrorMessage}
                </div>
              )}

              <Button disabled={isLoggingIn} type="submit" className="h-14 w-full rounded-[1.25rem] text-base font-semibold">
                {isLoggingIn ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-sm text-slate-500">ou continue com</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Button
                variant="secondary"
                className="h-12 rounded-[1.2rem] border-slate-200 bg-white/94 text-sm font-semibold text-slate-900 shadow-none hover:bg-white"
              >
                <GoogleIcon />
                Google
              </Button>
              <Button
                variant="secondary"
                className="h-12 rounded-[1.2rem] border-slate-200 bg-white/94 text-sm font-semibold text-slate-900 shadow-none hover:bg-white"
              >
                <AppleIcon />
                Apple
              </Button>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6 text-center">
              <p className="text-sm text-slate-500 md:text-base">
                Ainda não tem uma conta?{' '}
                <Link to="/signup" className="font-semibold text-brand-500 transition hover:text-brand-600">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
