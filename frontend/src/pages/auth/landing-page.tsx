import { ArrowRight, HeartPulse, ShieldCheck, Sparkles, Waves } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { FemaleWellnessIllustration } from '@/components/female-wellness-illustration'
import { LandingPreview } from '@/components/landing-preview'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'

const featureCards = [
  {
    title: 'Acompanhamento delicado',
    description: 'Registre dor, humor e sono sem fricção, com uma experiência acolhedora.',
    icon: HeartPulse,
  },
  {
    title: 'Insights com IA',
    description: 'Reconheça padrões antes que eles virem crises, com recomendações úteis.',
    icon: Sparkles,
  },
  {
    title: 'Cuidado seguro',
    description: 'Compartilhe evolução com a equipe médica de forma elegante e estruturada.',
    icon: ShieldCheck,
  },
]

export function LandingPage() {
  usePageTitle('Bem-vinda')

  return (
    <section className="mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-7xl items-center gap-5 xl:grid-cols-[minmax(0,1.04fr)_minmax(18rem,0.96fr)]">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="panel-surface overflow-hidden p-5 md:p-6 xl:p-8"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <BrandLogo />
            <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-2 text-xs font-medium text-brand-700 shadow-soft md:flex">
              <Waves className="h-4 w-4" />
              Fibromialgia com cuidado humano + IA
            </div>
          </div>

          <div className="max-w-2xl space-y-3">
            <p className="section-label">HealthTech premium para rotina de cuidado contínuo</p>
            <h1 className="max-w-xl text-3xl font-semibold leading-tight text-balance md:text-4xl xl:text-5xl">
              Sincronize sintomas, autocuidado e acompanhamento clínico em uma única experiência.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base xl:text-lg">
              FibroSync foi desenhada para transformar o registro diário em clareza, acolhimento e
              decisões melhores para pacientes e profissionais.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-[10.5rem]">
              <Link to="/signup">
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="min-w-[10.5rem]">
              <Link to="/login">Já tenho uma conta</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((card) => (
              <div key={card.title} className="card-surface p-4">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <card.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-foreground">{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <FemaleWellnessIllustration />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, delay: 0.1 }}
        className="space-y-5"
      >
        <LandingPreview />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card-surface p-5">
            <p className="section-label">Dor</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-foreground">5,4</p>
            <p className="mt-1 text-sm text-muted-foreground">Média semanal moderada</p>
          </div>
          <div className="card-surface p-5">
            <p className="section-label">Sono</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-foreground">7h 20m</p>
            <p className="mt-1 text-sm text-muted-foreground">Ritmo noturno em melhora</p>
          </div>
          <div className="card-surface p-5">
            <p className="section-label">Adesão</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-foreground">92%</p>
            <p className="mt-1 text-sm text-muted-foreground">Consistência de registros</p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
