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
    <section className="relative flex min-h-[calc(100vh-3rem)] items-center justify-center overflow-hidden py-4">
      <div className="absolute left-[-12rem] top-[8%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(197,177,255,0.42),rgba(197,177,255,0.12),transparent_70%)]" />
      <div className="absolute bottom-[-9rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(207,188,255,0.32),rgba(207,188,255,0.1),transparent_72%)]" />
      <div className="absolute left-[18%] top-[19%] h-3 w-3 rounded-full bg-brand-300/80 blur-[1px]" />
      <div className="absolute right-[16%] top-[24%] h-4 w-4 rounded-full bg-brand-200/85 blur-[1px]" />
      <div className="absolute bottom-[15%] right-[23%] h-3 w-3 rounded-full bg-brand-200/70 blur-[1px]" />

      <div className="relative z-10 mx-auto w-full max-w-[43rem] px-5 md:px-8">
        <div className="rounded-[2.6rem] border border-white/80 bg-white/82 px-5 py-8 shadow-[0_40px_110px_rgba(121,95,180,0.12)] backdrop-blur-xl md:px-10 md:py-10">
          <AuthHeroLogo />

          <div className="mx-auto mt-10 max-w-[31rem]">
            <div className="space-y-2 text-center">
              <h2 className="text-[2rem] font-semibold tracking-[-0.06em] text-slate-950 md:text-[2.4rem]">
                Bem-vinda de volta! <span className="text-brand-500">💜</span>
              </h2>
              <p className="text-[1.05rem] leading-7 text-slate-500 md:text-[1.2rem]">
                Faça login para continuar cuidando de você.
              </p>
            </div>

            <div className="mt-10 space-y-5">
              <label className="block">
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-brand-500" />
                  <Input
                    className="h-[5.2rem] rounded-[1.7rem] border-slate-200 bg-white/92 pl-20 pr-6 text-[1.1rem] text-slate-700 placeholder:text-slate-400 md:h-[5.5rem] md:text-[1.15rem]"
                    placeholder="E-mail"
                  />
                </div>
              </label>

              <label className="block">
                <div className="relative">
                  <LockKeyhole className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-brand-500" />
                  <Input
                    className="h-[5.2rem] rounded-[1.7rem] border-slate-200 bg-white/92 pl-20 pr-16 text-[1.1rem] text-slate-700 placeholder:text-slate-400 md:h-[5.5rem] md:text-[1.15rem]"
                    placeholder="Senha"
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-brand-500"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Eye className="h-7 w-7" />
                  </button>
                </div>
              </label>

              <div className="flex justify-end pr-1">
                <button
                  type="button"
                  className="text-[1rem] font-medium text-brand-500 transition hover:text-brand-600 md:text-[1.05rem]"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <Button className="h-[5rem] w-full rounded-[1.6rem] text-[1.15rem] font-semibold md:h-[5.35rem] md:text-[1.2rem]">
                Entrar
              </Button>
            </div>

            <div className="my-7 flex items-center gap-5">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[1rem] text-slate-500 md:text-[1.05rem]">ou continue com</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Button
                variant="secondary"
                className="h-[4.6rem] rounded-[1.5rem] border-slate-200 bg-white/94 text-[1.1rem] font-semibold text-slate-900 shadow-none hover:bg-white"
              >
                <GoogleIcon />
                Google
              </Button>
              <Button
                variant="secondary"
                className="h-[4.6rem] rounded-[1.5rem] border-slate-200 bg-white/94 text-[1.1rem] font-semibold text-slate-900 shadow-none hover:bg-white"
              >
                <AppleIcon />
                Apple
              </Button>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                type="button"
                className="group flex flex-col items-center gap-4 rounded-[2rem] px-5 py-3 transition hover:bg-brand-50/60"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(123,77,255,0.12),transparent_68%)] text-brand-500">
                  <Fingerprint className="h-16 w-16 stroke-[1.6]" />
                </div>
                <span className="text-[1.05rem] font-medium text-slate-500 md:text-[1.12rem]">
                  Entrar com biometria
                </span>
              </button>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8 text-center">
              <p className="text-[1.05rem] text-slate-500 md:text-[1.12rem]">
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
