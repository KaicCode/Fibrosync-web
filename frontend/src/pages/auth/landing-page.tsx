import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CloudRain,
  FileText,
  HeartPulse,
  LayoutGrid,
  Menu,
  MoonStar,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { LandingReveal } from '@/components/marketing/landing-reveal'
import { LandingSectionHeading } from '@/components/marketing/landing-section-heading'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Como Funciona', href: '#como-funciona' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Contato', href: '#contato' },
]

const heroHighlights = ['Registro diario', 'Dashboard inteligente', 'Relatorios completos']

const heroFloatingCards = [
  {
    emoji: '💜',
    label: 'Dor Hoje',
    value: '4/10',
    detail: 'Registrada agora',
    className: '-left-4 top-10 lg:-left-12 lg:top-20',
  },
  {
    emoji: '😴',
    label: 'Sono',
    value: '7 horas',
    detail: 'Noite mais estavel',
    className: 'right-2 top-5 lg:right-0 lg:top-12',
  },
  {
    emoji: '📈',
    label: 'Evolucao',
    value: '+23%',
    detail: 'Ultimos 30 dias',
    className: '-left-1 bottom-10 lg:-left-10 lg:bottom-20',
  },
  {
    emoji: '🤖',
    label: 'IA',
    value: 'Analise concluida',
    detail: 'Padroes atualizados',
    className: 'right-0 bottom-3 lg:right-2 lg:bottom-12',
  },
]

const howItWorksSteps = [
  {
    number: '01',
    title: 'Crie sua conta',
    description: 'Monte seu perfil em poucos minutos e personalize a forma como deseja acompanhar sua saude.',
  },
  {
    number: '02',
    title: 'Registre seus sintomas',
    description: 'Anote dor, sono, humor e gatilhos com uma rotina simples, rapida e acessivel.',
  },
  {
    number: '03',
    title: 'Visualize graficos e historico',
    description: 'Entenda sua evolucao com dados claros, dashboards objetivos e leitura visual amigavel.',
  },
  {
    number: '04',
    title: 'Compartilhe relatorios',
    description: 'Leve informacoes relevantes para consultas e facilite a conversa com profissionais da saude.',
  },
]

const features: Array<{
  icon: LucideIcon
  title: string
  description: string
}> = [
  {
    icon: HeartPulse,
    title: 'Registro Diario',
    description: 'Acompanhe dor, fadiga, rigidez, humor, sono e atividades em um fluxo intuitivo.',
  },
  {
    icon: LayoutGrid,
    title: 'Dashboard Inteligente',
    description: 'Tenha uma visao consolidada da sua jornada com indicadores claros e leitura premium.',
  },
  {
    icon: Stethoscope,
    title: 'Mapa Corporal',
    description: 'Marque regioes do corpo com precisao para registrar sintomas sem confusao.',
  },
  {
    icon: CalendarDays,
    title: 'Calendario',
    description: 'Consulte dias anteriores, identifique recorrencias e acompanhe sua consistencia.',
  },
  {
    icon: FileText,
    title: 'Relatorios',
    description: 'Gere resumos estruturados para consultas, retornos medicos e monitoramento clinico.',
  },
  {
    icon: Sparkles,
    title: 'IA para Insights',
    description: 'Descubra padroes ocultos e receba leituras mais inteligentes sobre sua rotina.',
  },
  {
    icon: Activity,
    title: 'Historico',
    description: 'Mantenha uma linha do tempo confiavel para entender gatilhos e progressos reais.',
  },
  {
    icon: CloudRain,
    title: 'Monitoramento Climatico',
    description: 'Cruze sensacoes do corpo com variacoes do clima e perceba correlacoes relevantes.',
  },
]

const aboutHighlights: Array<{
  icon: LucideIcon
  title: string
  description: string
}> = [
  {
    icon: ShieldCheck,
    title: 'Confianca em cada registro',
    description: 'Interface acolhedora para transformar dados sensiveis em acompanhamento consistente.',
  },
  {
    icon: MoonStar,
    title: 'Dor, sono e humor no mesmo contexto',
    description: 'Uma leitura integrada da rotina para enxergar o que realmente impacta o seu bem-estar.',
  },
  {
    icon: BarChart3,
    title: 'Evolucao clinica com clareza',
    description: 'Graficos e historicos que ajudam a conversar melhor com a equipe de saude.',
  },
  {
    icon: Sparkles,
    title: 'Tecnologia a favor da autonomia',
    description: 'Recursos inteligentes para apoiar decisoes com mais seguranca e menos sobrecarga.',
  },
]

type FloatingMetricCardProps = {
  emoji: string
  label: string
  value: string
  detail: string
  className?: string
  floating?: boolean
}

function FloatingMetricCard({
  emoji,
  label,
  value,
  detail,
  className,
  floating = false,
}: FloatingMetricCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={
        reduceMotion || !floating
          ? { opacity: 1 }
          : {
              y: [0, -10, 0],
              x: [0, 3, 0],
            }
      }
      transition={{
        duration: 5.8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={cn(
        'glass-surface glow-ring min-w-[11rem] rounded-[1.4rem] border border-white/80 bg-white/72 p-3 shadow-[0_18px_48px_rgba(109,88,180,0.18)] backdrop-blur-2xl',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(37,99,235,0.18))] text-lg">
          <span aria-hidden="true">{emoji}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
          <p className="mt-1 text-base font-semibold tracking-[-0.04em] text-slate-950 sm:text-lg">
            {value}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
      </div>
    </motion.div>
  )
}

type MarketingCardProps = {
  title: string
  description: string
  icon?: LucideIcon
  number?: string
  eyebrow?: string
}

function MarketingCard({ title, description, icon: Icon, number, eyebrow }: MarketingCardProps) {
  return (
    <div className="group relative h-full overflow-hidden rounded-[1.75rem] border border-white/75 bg-white/80 p-6 shadow-soft backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_64px_rgba(110,92,176,0.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.1),transparent_30%)] opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-center gap-3">
          {number ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7C3AED_0%,#2563EB_100%)] text-sm font-semibold tracking-[0.2em] text-white shadow-glow">
              {number}
            </div>
          ) : null}
          {Icon ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(37,99,235,0.16))] text-brand-700 transition duration-300 group-hover:scale-105">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          {eyebrow ? <p className="section-label text-brand-700/90">{eyebrow}</p> : null}
        </div>

        <h3 className="mt-5 text-xl font-semibold tracking-[-0.05em] text-slate-950">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      </div>
    </div>
  )
}

function NavAnchor({
  href,
  label,
  className,
  onClick,
}: {
  href: string
  label: string
  className?: string
  onClick?: () => void
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        'text-sm font-medium text-slate-600 transition duration-200 hover:text-brand-700',
        className,
      )}
    >
      {label}
    </a>
  )
}

export function LandingPage() {
  usePageTitle('FibroSync')

  const reduceMotion = useReducedMotion()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 18)

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.24),transparent_64%)] blur-3xl" />
        <div className="absolute -left-24 top-[16rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.16),transparent_68%)] blur-3xl" />
        <div className="absolute -right-20 top-[42rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18),transparent_66%)] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[72rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.5),transparent_55%)]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className={cn(
              'rounded-[1.8rem] border px-4 py-3 transition duration-300 sm:px-5',
              isScrolled
                ? 'border-white/80 bg-white/72 shadow-[0_20px_52px_rgba(120,95,185,0.14)] backdrop-blur-2xl'
                : 'border-white/55 bg-white/44 backdrop-blur-lg',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <Link to="/" className="flex items-center gap-3">
                <BrandLogo compact />
                <div>
                  <p className="text-base font-semibold tracking-[-0.05em] text-slate-950 sm:text-lg">
                    Fibro<span className="gradient-text">Sync</span>
                  </p>
                  <p className="hidden text-xs text-slate-500 sm:block">Tecnologia gentil para a fibromialgia</p>
                </div>
              </Link>

              <nav className="hidden items-center gap-7 lg:flex">
                {navItems.map((item) => (
                  <NavAnchor key={item.href} href={item.href} label={item.label} />
                ))}
              </nav>

              <div className="hidden items-center gap-3 lg:flex">
                <Button asChild variant="secondary" className="border-white/80 bg-white/78">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button asChild className="shadow-[0_20px_45px_rgba(124,58,237,0.26)]">
                  <Link to="/signup">
                    Criar Conta
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((current) => !current)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/75 text-slate-700 backdrop-blur-xl transition hover:text-brand-700 lg:hidden"
                aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {mobileMenuOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
                className="mt-3 rounded-[1.8rem] border border-white/80 bg-white/80 p-4 shadow-panel backdrop-blur-2xl lg:hidden"
              >
                <div className="flex flex-col gap-3">
                  {navItems.map((item) => (
                    <NavAnchor
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-2xl px-2 py-2 text-base"
                    />
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <Button asChild variant="secondary" className="w-full border-white/80 bg-white/84">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      Entrar
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                      Criar Conta
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </header>

      <main>
        <section id="inicio" className="scroll-mt-28 px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8 lg:pb-28 lg:pt-40">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <LandingReveal className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-brand-700 shadow-soft backdrop-blur-xl">
                <ShieldCheck className="h-4 w-4" />
                Plataforma inteligente para acompanhamento da fibromialgia
              </div>

              <h1 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.08em] text-slate-950 sm:text-5xl lg:text-[4.3rem]">
                Entenda sua fibromialgia. Acompanhe sua evolucao. Viva com mais qualidade.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                O FibroSync ajuda pessoas com fibromialgia a registrar sintomas diariamente,
                acompanhar sua evolucao, identificar padroes e compartilhar informacoes
                importantes com profissionais da saude.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="min-w-[11rem] shadow-[0_24px_56px_rgba(124,58,237,0.28)]">
                  <Link to="/signup">
                    Criar Conta
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="min-w-[11rem] border-white/85 bg-white/82"
                >
                  <Link to="/login">Entrar</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {heroHighlights.map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/76 px-4 py-2 text-sm font-medium text-slate-700 shadow-soft backdrop-blur-xl"
                  >
                    <Check className="h-4 w-4 text-brand-600" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { value: '24/7', label: 'Registro continuo' },
                  { value: 'IA', label: 'Insights acessiveis' },
                  { value: '1 clique', label: 'Compartilhamento clinico' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.5rem] border border-white/75 bg-white/72 p-4 shadow-soft backdrop-blur-xl"
                  >
                    <p className="text-2xl font-semibold tracking-[-0.06em] text-slate-950">{item.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </LandingReveal>

            <LandingReveal delay={0.1} className="relative">
              <div className="absolute inset-x-[12%] top-[12%] -z-10 h-[72%] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.24),rgba(37,99,235,0.12),transparent_72%)] blur-3xl" />

              <motion.div
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : {
                        y: [0, -12, 0],
                        rotateX: [4, 6, 4],
                        rotateY: [-8, -5, -8],
                        rotateZ: [-1.1, 0.6, -1.1],
                      }
                }
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative mx-auto max-w-[54rem] rounded-[2.2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(248,245,255,0.6))] p-3 shadow-[0_38px_110px_rgba(114,91,173,0.22)] backdrop-blur-2xl"
              >
                <div className="absolute inset-0 rounded-[2.2rem] bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.12),transparent_34%)]" />

                <div className="relative rounded-[1.9rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(249,247,255,0.88))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-white/75 bg-white/76 px-4 py-3 backdrop-blur-xl">
                    <div>
                      <p className="section-label text-brand-700/90">Dashboard oficial</p>
                      <p className="mt-1 text-sm font-medium text-slate-600">
                        Registro rapido, mapa corporal e evolucao clinica no mesmo fluxo.
                      </p>
                    </div>
                    <div className="rounded-full border border-brand-200/70 bg-brand-50/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Hero premium
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[1.6rem] border border-white/75 bg-white/90 p-2 shadow-[0_22px_60px_rgba(136,119,195,0.14)]">
                    <img
                      src="/fibrosync-dashboard.png"
                      alt="Mockup oficial do dashboard FibroSync"
                      className="h-auto w-full rounded-[1.15rem] object-contain"
                      loading="eager"
                    />
                  </div>
                </div>
              </motion.div>

              <div className="pointer-events-none absolute inset-0 hidden md:block">
                {heroFloatingCards.map((card) => (
                  <div key={card.label} className={cn('absolute', card.className)}>
                    <FloatingMetricCard {...card} floating />
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:hidden">
                {heroFloatingCards.map((card) => (
                  <FloatingMetricCard key={card.label} {...card} />
                ))}
              </div>

              <p className="mt-5 text-center text-sm leading-6 text-slate-500">
                O mockup oficial do FibroSync permanece em destaque, sem cortes ou distorcoes,
                para transmitir confianca, precisao e evolucao visual do produto.
              </p>
            </LandingReveal>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-28 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <LandingReveal>
              <LandingSectionHeading
                eyebrow="Fluxo simplificado"
                title="Como o FibroSync transforma acompanhamento em clareza"
                description="Cada etapa foi pensada para reduzir esforco, aumentar consistencia e gerar informacoes realmente uteis para o dia a dia."
              />
            </LandingReveal>

            <div className="mt-12 grid gap-5 lg:grid-cols-4">
              {howItWorksSteps.map((step, index) => (
                <LandingReveal key={step.title} delay={index * 0.06}>
                  <MarketingCard
                    number={step.number}
                    eyebrow="Passo a passo"
                    title={step.title}
                    description={step.description}
                  />
                </LandingReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="scroll-mt-28 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/70 bg-white/58 p-6 shadow-panel backdrop-blur-2xl sm:p-8 lg:p-10">
            <LandingReveal>
              <LandingSectionHeading
                eyebrow="Funcionalidades"
                title="Recursos desenhados para rotina, previsibilidade e suporte clinico"
                description="Um ecossistema visualmente elegante para registrar sintomas, explorar tendencias e compartilhar informacoes com mais seguranca."
              />
            </LandingReveal>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {features.map((feature, index) => (
                <LandingReveal key={feature.title} delay={index * 0.04}>
                  <MarketingCard
                    icon={feature.icon}
                    eyebrow="FibroSync"
                    title={feature.title}
                    description={feature.description}
                  />
                </LandingReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="sobre" className="scroll-mt-28 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
              <LandingReveal className="lg:sticky lg:top-28">
                <LandingSectionHeading
                  eyebrow="Sobre a plataforma"
                  align="left"
                  title="Tecnologia premium para auxiliar pessoas com fibromialgia com mais contexto e autonomia"
                  description="O FibroSync e uma plataforma criada para auxiliar pessoas com fibromialgia no acompanhamento da dor, sintomas, sono, humor e evolucao clinica atraves de tecnologia. A proposta e tornar o autocuidado mais claro, acolhedor e util tanto para pacientes quanto para profissionais da saude."
                />

                <div className="mt-8 rounded-[1.75rem] border border-white/75 bg-white/75 p-6 shadow-soft backdrop-blur-2xl">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7C3AED_0%,#2563EB_100%)] text-white shadow-glow">
                      <HeartPulse className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
                        Cuidado com linguagem acessivel
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Cada bloco da experiencia foi pensado para reduzir friccao, manter a
                        leitura clara e apoiar decisoes com serenidade.
                      </p>
                    </div>
                  </div>
                </div>
              </LandingReveal>

              <div className="grid gap-5 sm:grid-cols-2">
                {aboutHighlights.map((item, index) => (
                  <LandingReveal key={item.title} delay={index * 0.05}>
                    <MarketingCard
                      icon={item.icon}
                      eyebrow="Confiança + saude"
                      title={item.title}
                      description={item.description}
                    />
                  </LandingReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contato" className="scroll-mt-28 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <LandingReveal>
              <div className="relative overflow-hidden rounded-[2.4rem] border border-white/80 bg-[linear-gradient(135deg,rgba(124,58,237,0.94),rgba(37,99,235,0.88))] px-6 py-12 text-center shadow-[0_34px_100px_rgba(93,76,170,0.28)] sm:px-10 lg:px-14 lg:py-16">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_28%)]" />
                <div className="absolute left-8 top-8 h-20 w-20 rounded-full border border-white/20 bg-white/10 blur-2xl" />
                <div className="absolute bottom-8 right-8 h-24 w-24 rounded-full border border-white/20 bg-white/10 blur-2xl" />

                <div className="relative mx-auto max-w-3xl">
                  <p className="section-label text-white/80">CTA final</p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl lg:text-[3.1rem]">
                    Comece hoje gratuitamente.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-white/82 sm:text-base lg:text-lg">
                    Crie sua conta, acompanhe seus registros e compartilhe uma leitura mais
                    completa da sua jornada com a equipe de saude.
                  </p>

                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button
                      asChild
                      size="lg"
                      variant="secondary"
                      className="border-white/20 bg-white text-slate-950 hover:bg-white"
                    >
                      <Link to="/signup">Criar Conta</Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      className="border border-white/24 bg-white/12 text-white shadow-none hover:bg-white/18"
                    >
                      <Link to="/login">Entrar</Link>
                    </Button>
                  </div>

                  <p className="mt-6 text-sm text-white/78">
                    Contato inicial: <a href="mailto:contato@fibrosync.app" className="font-semibold text-white">contato@fibrosync.app</a>
                  </p>
                </div>
              </div>
            </LandingReveal>
          </div>
        </section>
      </main>

      <footer className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/75 bg-white/78 p-6 shadow-soft backdrop-blur-2xl sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.75fr_0.78fr_0.78fr_0.75fr]">
            <div>
              <div className="flex items-center gap-3">
                <BrandLogo compact />
                <div>
                  <p className="text-lg font-semibold tracking-[-0.05em] text-slate-950">
                    Fibro<span className="gradient-text">Sync</span>
                  </p>
                  <p className="text-sm text-slate-500">Confianca, clareza e acompanhamento continuo.</p>
                </div>
              </div>

              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
                Uma landing page desenhada para comunicar saude, tecnologia e acessibilidade
                sem perder a sensacao premium do produto.
              </p>
            </div>

            <div>
              <p className="section-label text-brand-700/90">Links rapidos</p>
              <div className="mt-4 flex flex-col gap-3">
                {navItems.map((item) => (
                  <NavAnchor key={item.href} href={item.href} label={item.label} />
                ))}
              </div>
            </div>

            <div>
              <p className="section-label text-brand-700/90">Contato</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                <a href="mailto:contato@fibrosync.app" className="transition hover:text-brand-700">
                  contato@fibrosync.app
                </a>
                <a href="mailto:suporte@fibrosync.app" className="transition hover:text-brand-700">
                  suporte@fibrosync.app
                </a>
                <p>Atendimento remoto com foco em pacientes e equipes de saude.</p>
              </div>
            </div>

            <div>
              <p className="section-label text-brand-700/90">Legal</p>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <a href="#politica-de-privacidade" className="text-slate-600 transition hover:text-brand-700">
                  Politica de Privacidade
                </a>
                <a href="#termos-de-uso" className="text-slate-600 transition hover:text-brand-700">
                  Termos de Uso
                </a>
              </div>
            </div>

            <div>
              <p className="section-label text-brand-700/90">Redes sociais</p>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-600 transition hover:text-brand-700"
                >
                  Instagram
                </a>
                <a
                  href="https://www.linkedin.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-600 transition hover:text-brand-700"
                >
                  LinkedIn
                </a>
                <a
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-600 transition hover:text-brand-700"
                >
                  YouTube
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div
              id="politica-de-privacidade"
              className="rounded-[1.5rem] border border-white/80 bg-white/70 p-5 backdrop-blur-xl"
            >
              <p className="section-label text-brand-700/90">Politica de Privacidade</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Dados de saude exigem cuidado redobrado. O FibroSync foi apresentado com foco
                em consentimento, seguranca e compartilhamento consciente das informacoes.
              </p>
            </div>

            <div
              id="termos-de-uso"
              className="rounded-[1.5rem] border border-white/80 bg-white/70 p-5 backdrop-blur-xl"
            >
              <p className="section-label text-brand-700/90">Termos de Uso</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                A plataforma apoia acompanhamento e organizacao da jornada, sem substituir
                orientacao medica profissional ou atendimento clinico especializado.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/70 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} FibroSync. Todos os direitos reservados.</p>
            <p>Politica de Privacidade • Termos de Uso • Design responsivo e premium</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
