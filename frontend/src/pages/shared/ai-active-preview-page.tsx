import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  BellRing,
  Brain,
  Cog,
  HeartPulse,
  Rocket,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'
import {
  inferRoleFromPath,
  workspaceDashboardPathByVariant,
} from '@/lib/navigation'

const progressValue = 70

const preparationItems = [
  {
    icon: Sparkles,
    title: 'Melhor experiencia de uso',
    description: 'Fluxos mais fluidos, intuitivos e agradaveis em qualquer tela.',
  },
  {
    icon: Brain,
    title: 'Recursos inteligentes',
    description: 'Camadas de IA com respostas mais uteis e contexto mais rico.',
  },
  {
    icon: Stethoscope,
    title: 'Integracao com seus dados de saude',
    description: 'Mais conexao entre sintomas, registros e sinais clinicos.',
  },
  {
    icon: BarChart3,
    title: 'Analises mais completas',
    description: 'Leituras visuais mais profundas sobre sua evolucao diaria.',
  },
  {
    icon: ShieldCheck,
    title: 'Novas funcionalidades exclusivas',
    description: 'Experiencias premium desenhadas para cuidado continuo e seguro.',
  },
]

function InnovationIllustration() {
  return (
    <div className="relative mx-auto flex h-[18rem] w-[18rem] items-center justify-center sm:h-[21rem] sm:w-[21rem]">
      <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(108,92,231,0.24),rgba(74,144,226,0.14),transparent_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(108,92,231,0.35),rgba(74,144,226,0.18),transparent_72%)]" />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 26, ease: 'linear', repeat: Infinity }}
        className="absolute inset-3 rounded-full border border-white/65 border-dashed dark:border-white/15"
      />

      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex h-40 w-40 items-center justify-center rounded-[2.75rem] border border-white/80 bg-[linear-gradient(145deg,#6C5CE7_0%,#4A90E2_100%)] shadow-[0_34px_90px_rgba(108,92,231,0.34)] sm:h-48 sm:w-48"
      >
        <div className="absolute inset-[1px] rounded-[2.65rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.02))]" />
        <Rocket className="relative h-14 w-14 text-white sm:h-16 sm:w-16" />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, ease: 'linear', repeat: Infinity }}
          className="absolute -right-4 bottom-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/92 shadow-soft dark:border-white/10 dark:bg-slate-900/80"
        >
          <Cog className="h-5 w-5 text-[#6C5CE7]" />
        </motion.div>

        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-5 top-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/92 shadow-soft dark:border-white/10 dark:bg-slate-900/80"
        >
          <Sparkles className="h-5 w-5 text-[#4A90E2]" />
        </motion.div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-0 top-8 rounded-full border border-white/80 bg-white/88 px-3 py-2 text-xs font-semibold text-slate-700 shadow-soft dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100"
      >
        IA + insights
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-0 top-12 rounded-full border border-white/80 bg-white/88 px-3 py-2 text-xs font-semibold text-slate-700 shadow-soft dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100"
      >
        Health data
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-4 rounded-full border border-white/80 bg-white/88 px-3 py-2 text-xs font-semibold text-slate-700 shadow-soft dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100"
      >
        Lancamento em breve
      </motion.div>
    </div>
  )
}

export function AiActivePreviewPage() {
  usePageTitle('IA ativa em desenvolvimento')

  const location = useLocation()
  const variant = inferRoleFromPath(location.pathname)
  const dashboardPath = workspaceDashboardPathByVariant[variant]
  const [receiveUpdates, setReceiveUpdates] = useState(false)

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-6rem] top-8 h-40 w-40 rounded-full bg-[#6C5CE7]/18 blur-3xl dark:bg-[#6C5CE7]/24" />
        <div className="absolute bottom-4 right-[-5rem] h-44 w-44 rounded-full bg-[#4A90E2]/16 blur-3xl dark:bg-[#4A90E2]/24" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="panel-surface relative overflow-hidden p-4 sm:p-6 lg:p-8 xl:p-10 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(30,41,59,0.76))]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(108,92,231,0.1),rgba(74,144,226,0.08),transparent_58%)] dark:bg-[linear-gradient(140deg,rgba(108,92,231,0.16),rgba(74,144,226,0.1),transparent_58%)]" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
          >
            <Badge className="border border-white/80 bg-white/90 px-4 py-2 text-[0.72rem] uppercase tracking-[0.22em] text-[#6C5CE7] shadow-soft dark:border-white/10 dark:bg-slate-900/85 dark:text-[#C9C2FF]">
              FibroSync Labs
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.14, duration: 0.55 }}
            className="mt-6"
          >
            <InnovationIllustration />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-3xl space-y-3"
          >
            <h1 className="text-balance text-3xl font-semibold tracking-[-0.07em] text-slate-950 sm:text-4xl lg:text-[3.35rem] dark:text-white">
              Estamos construindo algo incrivel para voce
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 sm:text-base lg:text-lg dark:text-slate-300">
              Esta funcionalidade ainda esta em desenvolvimento e em breve estara
              disponivel no FibroSync.
            </p>
          </motion.div>

          <div className="mt-8 grid w-full gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.5 }}
              className="rounded-[1.75rem] border border-white/75 bg-white/88 p-5 text-left shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/78"
            >
              <p className="section-label">O que estamos preparando?</p>
              <div className="mt-4 space-y-3">
                {preparationItems.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-[1.25rem] border border-white/75 bg-white/72 px-4 py-3 shadow-soft dark:border-white/10 dark:bg-slate-950/45"
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(108,92,231,0.16),rgba(74,144,226,0.16))] text-[#6C5CE7] dark:text-[#B9B5FF]">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.5 }}
                className="rounded-[1.75rem] border border-white/75 bg-white/88 p-5 text-left shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/78"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Progresso do produto</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                      Desenvolvimento: 70% concluido
                    </h2>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Em evolucao
                  </div>
                </div>

                <div className="mt-6">
                  <div className="h-4 overflow-hidden rounded-full bg-slate-200/85 p-[2px] dark:bg-slate-800/90">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressValue}%` }}
                      transition={{ delay: 0.5, duration: 1.1, ease: 'easeOut' }}
                      className="relative h-full overflow-hidden rounded-full bg-[linear-gradient(90deg,#6C5CE7_0%,#4A90E2_100%)] shadow-[0_10px_30px_rgba(108,92,231,0.28)]"
                    >
                      <motion.div
                        animate={{ x: ['-120%', '180%'] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-y-0 w-16 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.72),transparent)]"
                      />
                    </motion.div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">
                      Entregando com qualidade, clareza e mais inteligencia.
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {progressValue}%
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="rounded-[1.75rem] border border-white/75 bg-[linear-gradient(135deg,rgba(108,92,231,0.12),rgba(74,144,226,0.1))] p-5 text-left shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(108,92,231,0.18),rgba(74,144,226,0.12))]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-[#6C5CE7] shadow-soft dark:bg-slate-900/80 dark:text-[#C9C2FF]">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-950 dark:text-white">
                      Transparencia com cara de produto premium
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Preferimos mostrar o que esta em construcao com clareza e
                      confianca, em vez de parecer que algo falhou.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46, duration: 0.5 }}
            className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={dashboardPath}>
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </Link>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="w-full border-white/80 bg-white/90 shadow-soft hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(74,144,226,0.16)] sm:w-auto dark:border-white/10 dark:bg-slate-900/80 dark:text-white"
              onClick={() => setReceiveUpdates(true)}
            >
              <BellRing className="h-4 w-4" />
              Receber novidades
            </Button>
          </motion.div>

          <AnimatePresence>
            {receiveUpdates ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-4 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-soft dark:border-white/10 dark:bg-slate-900/85 dark:text-slate-200"
              >
                Voce recebera novidades assim que essa experiencia estiver pronta.
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.54, duration: 0.5 }}
            className="mt-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            Obrigado por fazer parte da evolucao do FibroSync 💜
          </motion.p>
        </div>
      </motion.section>
    </div>
  )
}
