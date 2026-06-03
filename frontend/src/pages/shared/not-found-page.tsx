import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  Compass,
  HeartPulse,
  Home,
  Route,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'
import {
  inferRoleFromPath,
  workspaceDashboardPathByVariant,
} from '@/lib/navigation'
import { useAppStore } from '@/store/app-store'

const safeAreaItems = [
  {
    icon: HeartPulse,
    label: 'Acompanhe seus registros',
    description: 'Continue monitorando sintomas e sua rotina com tranquilidade.',
  },
  {
    icon: Route,
    label: 'Consulte seu histórico',
    description: 'Acesse rapidamente os dados que ajudam a entender sua jornada.',
  },
  {
    icon: BarChart3,
    label: 'Visualize suas análises',
    description: 'Veja tendências e padrões com uma leitura mais clara e útil.',
  },
  {
    icon: ShieldCheck,
    label: 'Continue cuidando da sua saúde',
    description: 'O restante do FibroSync segue pronto para apoiar seu autocuidado.',
  },
]

function NotFoundIllustration() {
  return (
    <div className="relative mx-auto flex h-[18rem] w-[18rem] items-center justify-center sm:h-[21rem] sm:w-[21rem] lg:h-[24rem] lg:w-[24rem]">
      <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(108,92,231,0.22),rgba(74,144,226,0.12),transparent_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(108,92,231,0.26),rgba(74,144,226,0.14),transparent_72%)]" />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 26, ease: 'linear', repeat: Infinity }}
        className="absolute inset-3 rounded-full border border-dashed border-white/75 dark:border-white/12"
      />

      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex h-44 w-44 items-center justify-center rounded-[2.9rem] border border-white/80 bg-[linear-gradient(145deg,#6C5CE7_0%,#4A90E2_100%)] shadow-[0_34px_90px_rgba(108,92,231,0.28)] sm:h-52 sm:w-52"
      >
        <div className="absolute inset-[1px] rounded-[2.8rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.02))]" />
        <Compass className="relative h-16 w-16 text-white sm:h-20 sm:w-20" />

        <motion.div
          animate={{ x: [0, 6, 0], y: [0, -4, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-5 top-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/92 text-[#6C5CE7] shadow-soft dark:border-white/10 dark:bg-slate-950/80 dark:text-[#C9C2FF]"
        >
          <Route className="h-5 w-5" />
        </motion.div>

        <motion.div
          animate={{ x: [0, -5, 0], y: [0, 5, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-4 bottom-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/92 text-[#4A90E2] shadow-soft dark:border-white/10 dark:bg-slate-950/80 dark:text-[#9FD0FF]"
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.1, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-1 top-10 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-soft dark:border-white/10 dark:bg-slate-950/85 dark:text-slate-100"
      >
        Rota nao encontrada
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-0 top-14 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-soft dark:border-white/10 dark:bg-slate-950/85 dark:text-slate-100"
      >
        Caminho seguro
      </motion.div>

      <svg
        viewBox="0 0 300 140"
        className="absolute bottom-4 left-1/2 h-24 w-[16rem] -translate-x-1/2 text-white/80 dark:text-white/10"
        fill="none"
      >
        <path
          d="M15 95C54 95 62 38 105 38C148 38 154 110 201 110C231 110 247 84 286 84"
          stroke="currentColor"
          strokeDasharray="7 9"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <circle cx="104" cy="38" r="8" fill="#6C5CE7" fillOpacity="0.9" />
        <circle cx="202" cy="110" r="8" fill="#4A90E2" fillOpacity="0.9" />
      </svg>
    </div>
  )
}

export function NotFoundPage() {
  usePageTitle('Pagina nao encontrada')

  const location = useLocation()
  const authSession = useAppStore((state) => state.authSession)
  const currentRole = useAppStore((state) => state.role)
  const routeVariant = inferRoleFromPath(location.pathname)
  const dashboardVariant =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/medical')
      ? routeVariant
      : authSession?.user.role === 'ADMIN'
        ? 'admin'
        : currentRole

  const dashboardPath = authSession
    ? workspaceDashboardPathByVariant[dashboardVariant]
    : '/landingpage'

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-3rem] h-64 w-64 rounded-full bg-[#6C5CE7]/12 blur-3xl dark:bg-[#6C5CE7]/18" />
        <div className="absolute bottom-[-4rem] right-[-3rem] h-64 w-64 rounded-full bg-[#4A90E2]/10 blur-3xl dark:bg-[#4A90E2]/16" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="panel-surface relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center overflow-hidden p-4 sm:p-6 lg:p-8 xl:p-10 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(30,41,59,0.8))]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(108,92,231,0.08),rgba(74,144,226,0.08),transparent_55%)] dark:bg-[linear-gradient(145deg,rgba(108,92,231,0.12),rgba(74,144,226,0.08),transparent_55%)]" />

        <div className="relative grid w-full gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,1.05fr)] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08, duration: 0.55 }}
            className="flex flex-col items-center text-center lg:items-start lg:text-left"
          >
            <Badge className="border border-white/80 bg-white/92 px-4 py-2 text-[0.72rem] uppercase tracking-[0.22em] text-[#6C5CE7] shadow-soft dark:border-white/10 dark:bg-slate-950/85 dark:text-[#C9C2FF]">
              FibroSync Navigation
            </Badge>

            <div className="mt-5">
              <NotFoundIllustration />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.14, duration: 0.55 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <p className="text-6xl font-semibold tracking-[-0.09em] text-slate-900 sm:text-7xl lg:text-8xl dark:text-white">
                404
              </p>
              <div className="space-y-3">
                <h1 className="text-balance text-3xl font-semibold tracking-[-0.07em] text-slate-950 sm:text-4xl lg:text-[3.25rem] dark:text-white">
                  Oops! Parece que voce se perdeu.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base lg:text-lg dark:text-slate-300">
                  A pagina que voce procura nao foi encontrada ou pode ter sido
                  movida.
                </p>
                <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base dark:text-slate-400">
                  Nao se preocupe. Vamos ajuda-lo a voltar para um local seguro
                  dentro do FibroSync.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to={dashboardPath}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Dashboard
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="w-full border-white/80 bg-white/92 shadow-soft hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(74,144,226,0.16)] sm:w-auto dark:border-white/10 dark:bg-slate-950/80 dark:text-white"
              >
                <a href="https://fibrosync.vercel.app/" target="_blank" rel="noreferrer">
                  <Home className="h-4 w-4" />
                  Pagina Inicial
                </a>
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.5 }}
              className="rounded-[1.75rem] border border-white/75 bg-white/88 p-5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(108,92,231,0.16),rgba(74,144,226,0.16))] text-[#6C5CE7] dark:text-[#C9C2FF]">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <p className="section-label">Enquanto isso...</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                    Seu cuidado continua por aqui
                  </h2>
                </div>
              </div>

              <div className="grid gap-3">
                {safeAreaItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-[1.25rem] border border-white/75 bg-white/76 px-4 py-3 shadow-soft dark:border-white/10 dark:bg-slate-900/55"
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100/90 text-[#4A90E2] dark:bg-slate-800/80 dark:text-[#9FD0FF]">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32, duration: 0.5 }}
              className="text-sm font-medium text-slate-500 dark:text-slate-400"
            >
              FibroSync • Transformando dados em qualidade de vida
            </motion.p>
          </motion.div>
        </div>
      </motion.section>
    </main>
  )
}
