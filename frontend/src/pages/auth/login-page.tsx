import { useState } from 'react'
import { Eye, Fingerprint, LockKeyhole, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuthHeroLogo } from '@/components/auth-hero-logo'
import { AppleIcon, GoogleIcon } from '@/components/provider-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePageTitle } from '@/hooks/use-page-title'

export function LoginPage() {
  usePageTitle('Entrar')

  const [showPassword, setShowPassword] = useState(false)

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
                Bem-vinda de volta! <span className="text-brand-500">💜</span>
              </h2>
              <p className="text-sm leading-6 text-slate-500 md:text-base">
                Faça login para continuar cuidando de você.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <label className="block">
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-500" />
                  <Input
                    className="h-14 rounded-[1.25rem] border-slate-200 bg-white/92 pl-14 pr-5 text-base text-slate-700 placeholder:text-slate-400"
                    placeholder="E-mail"
                  />
                </div>
              </label>

              <label className="block">
                <div className="relative">
                  <LockKeyhole className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-500" />
                  <Input
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

              <div className="flex justify-end pr-1">
                <button
                  type="button"
                  className="text-sm font-medium text-brand-500 transition hover:text-brand-600"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <Button className="h-14 w-full rounded-[1.25rem] text-base font-semibold">
                Entrar
              </Button>
            </div>

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

            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                type="button"
                className="group flex flex-col items-center gap-3 rounded-[1.5rem] px-4 py-3 transition hover:bg-brand-50/60"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(123,77,255,0.12),transparent_68%)] text-brand-500">
                  <Fingerprint className="h-12 w-12 stroke-[1.6]" />
                </div>
                <span className="text-sm font-medium text-slate-500 md:text-base">
                  Entrar com biometria
                </span>
              </button>
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
