import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUp, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { usePageTitle } from '@/hooks/use-page-title'

export type LegalDocumentSection = {
  number: number
  title: string
  content: ReactNode
}

export type LegalTocGroup = {
  label: string
  sectionNumbers: number[]
}

type LegalDocumentPageProps = {
  documentTitle: string
  title: string
  intro: ReactNode
  lastUpdated: string
  lastUpdatedDateTime: string
  sections: LegalDocumentSection[]
  tocGroups: LegalTocGroup[]
  tocAriaLabel: string
  navigationAriaLabel: string
  currentPath: '/termos-de-uso' | '/politica-de-privacidade'
}

type TocContentsProps = {
  activeId: string
  sections: LegalDocumentSection[]
  groups: LegalTocGroup[]
  ariaLabel: string
  onNavigate?: () => void
}

function TocContents({
  activeId,
  sections,
  groups,
  ariaLabel,
  onNavigate,
}: TocContentsProps) {
  const sectionByNumber = new Map(sections.map((section) => [section.number, section]))

  return (
    <nav aria-label={ariaLabel} className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-500">
            {group.label}
          </p>
          <ul className="space-y-0.5 border-l border-slate-200">
            {group.sectionNumbers.map((sectionNumber) => {
              const section = sectionByNumber.get(sectionNumber)
              if (!section) return null

              const id = `secao-${section.number}`
              const isActive = activeId === id

              return (
                <li key={section.number}>
                  <a
                    href={`#${id}`}
                    aria-current={isActive ? 'location' : undefined}
                    onClick={onNavigate}
                    className={`-ml-px block border-l px-3 py-1.5 text-[0.78rem] leading-5 transition-colors focus-visible:rounded-r-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                      isActive
                        ? 'border-brand-600 bg-brand-50 font-semibold text-brand-800'
                        : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <span className="mr-1.5 tabular-nums text-slate-400">{section.number}.</span>
                    {section.title}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function LegalSection({ section }: { section: LegalDocumentSection }) {
  const id = `secao-${section.number}`

  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className={`scroll-mt-28 px-5 py-11 sm:px-8 sm:py-14 lg:px-12 xl:px-14 ${
        section.number === 1 ? '' : 'border-t border-slate-200'
      }`}
    >
      <h2
        id={`${id}-titulo`}
        className="text-balance text-2xl font-semibold leading-tight tracking-[-0.035em] text-slate-950 sm:text-[1.7rem]"
      >
        <span className="mr-2 tabular-nums text-brand-700">{section.number}.</span>
        {section.title}
      </h2>
      <div className="mt-6 space-y-4 text-[1rem] leading-[1.72] text-slate-700 sm:text-[1.04rem] sm:leading-[1.75] [&_strong]:font-semibold [&_strong]:text-slate-900">
        {section.content}
      </div>
    </section>
  )
}

export function LegalDocumentPage({
  documentTitle,
  title,
  intro,
  lastUpdated,
  lastUpdatedDateTime,
  sections,
  tocGroups,
  tocAriaLabel,
  navigationAriaLabel,
  currentPath,
}: LegalDocumentPageProps) {
  usePageTitle(documentTitle)

  const [activeId, setActiveId] = useState('secao-1')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const desktopTocRef = useRef<HTMLDivElement>(null)
  const mobileTocRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hashTarget = window.location.hash

    if (hashTarget) {
      window.requestAnimationFrame(() => {
        document.querySelector(hashTarget)?.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start',
        })
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    let frameId = 0
    const updateScrollState = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        const activationLine = 180
        let currentId = 'secao-1'

        for (const section of sections) {
          const id = `secao-${section.number}`
          const element = document.getElementById(id)
          if (element && element.getBoundingClientRect().top <= activationLine) {
            currentId = id
          } else {
            break
          }
        }

        const reachedPageEnd =
          Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2
        if (reachedPageEnd) {
          currentId = `secao-${sections[sections.length - 1].number}`
        }

        setActiveId(currentId)
        setShowBackToTop(window.scrollY > 700)
      })
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [sections])

  useEffect(() => {
    const container = desktopTocRef.current
    const activeLink = container?.querySelector<HTMLAnchorElement>(`a[href="#${activeId}"]`)
    if (!container || !activeLink) return

    const containerBounds = container.getBoundingClientRect()
    const linkBounds = activeLink.getBoundingClientRect()
    const visiblePadding = 16

    if (linkBounds.top < containerBounds.top + visiblePadding) {
      container.scrollTo({
        top: container.scrollTop + linkBounds.top - containerBounds.top - visiblePadding,
        behavior: 'auto',
      })
    } else if (linkBounds.bottom > containerBounds.bottom - visiblePadding) {
      container.scrollTo({
        top: container.scrollTop + linkBounds.bottom - containerBounds.bottom + visiblePadding,
        behavior: 'auto',
      })
    }
  }, [activeId])

  const handleBackToTop = () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  const termsAreCurrent = currentPath === '/termos-de-uso'

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[4.5rem] max-w-[75rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label="Ir para a página inicial do FibroSync"
            className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4"
          >
            <BrandLogo compact />
            <span className="min-w-0">
              <span className="block text-lg font-bold leading-tight tracking-[-0.03em] text-slate-950 sm:text-xl">
                FibroSync
              </span>
              <span className="mt-0.5 block text-xs font-medium leading-tight text-slate-500">
                Documentação legal
              </span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300/50 bg-white/40 px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300/80 hover:bg-slate-50/80 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:px-4"
          >
            <span className="hidden sm:inline">Voltar ao início</span>
            <span className="sm:hidden">Voltar</span>
          </Link>
        </div>
      </header>

      <main>
        <div className="border-b border-slate-200 bg-white">
          <header className="mx-auto max-w-[75rem] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <h1 className="text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <div className="mt-5 max-w-3xl space-y-4 text-lg leading-8 text-slate-600">{intro}</div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="font-medium text-slate-700">Última atualização</span>
              <time dateTime={lastUpdatedDateTime}>{lastUpdated}</time>
            </div>
          </header>
        </div>

        <div className="mx-auto max-w-[75rem] px-4 py-8 sm:px-6 sm:py-10 lg:grid lg:grid-cols-[15rem_minmax(0,53.75rem)] lg:items-start lg:gap-12 lg:px-8 lg:py-14 xl:gap-16">
          <aside className="hidden lg:self-stretch lg:block" aria-label={navigationAriaLabel}>
            <div
              ref={desktopTocRef}
              className="sticky top-[6rem] max-h-[calc(100vh-7.5rem)] overflow-y-auto pr-2 scrollbar-subtle"
            >
              <p className="mb-5 text-sm font-semibold text-slate-900">Neste documento</p>
              <TocContents
                activeId={activeId}
                sections={sections}
                groups={tocGroups}
                ariaLabel={tocAriaLabel}
              />
            </div>
          </aside>

          <article className="min-w-0">
            <details
              ref={mobileTocRef}
              className="group mb-8 border-y border-slate-200 bg-white lg:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 [&::-webkit-details-marker]:hidden">
                Neste documento
                <ChevronDown
                  className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="border-t border-slate-200 px-4 py-5">
                <TocContents
                  activeId={activeId}
                  sections={sections}
                  groups={tocGroups}
                  ariaLabel={tocAriaLabel}
                  onNavigate={() => {
                    if (mobileTocRef.current) mobileTocRef.current.open = false
                  }}
                />
              </div>
            </details>

            {sections.map((section) => (
              <LegalSection key={section.number} section={section} />
            ))}
          </article>
        </div>

        <footer className="w-full bg-black text-slate-300">
          <div className="mx-auto max-w-[75rem] px-5 py-10 sm:px-6 lg:px-8 lg:py-12">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-semibold text-white">FibroSync</p>
                <p className="mt-2 text-sm text-slate-400">FIBROSYNC INOVA SIMPLES (I.S.)</p>
                <p className="mt-1 text-sm text-slate-400">CNPJ 66.126.229/0001-85</p>
                <p className="mt-1 text-sm text-slate-400">
                  &copy; 2026 FibroSync. Todos os direitos reservados.
                </p>
              </div>
              <div className="text-sm leading-7 sm:text-right">
                <p>
                  <span className="text-slate-500">Contato: </span>
                  <a
                    href="mailto:fibrosync@gmail.com"
                    className="text-slate-300 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    <strong>fibrosync@gmail.com</strong>
                  </a>
                </p>
                <p>
                  <span className="text-slate-500">Privacidade: </span>
                  <a
                    href="mailto:fibrosync@gmail.com"
                    className="text-slate-300 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    <strong>fibrosync@gmail.com</strong>
                  </a>
                </p>
              </div>
            </div>
            <nav
              aria-label="Links da área legal"
              className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-800 pt-6 text-sm"
            >
              <Link
                to="/termos-de-uso"
                aria-current={termsAreCurrent ? 'page' : undefined}
                className={
                  termsAreCurrent
                    ? 'font-medium text-white underline decoration-brand-400 underline-offset-4 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
                    : 'text-slate-300 underline decoration-slate-600 underline-offset-4 hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
                }
              >
                Termos de Uso
              </Link>
              <Link
                to="/politica-de-privacidade"
                aria-current={termsAreCurrent ? undefined : 'page'}
                className={
                  termsAreCurrent
                    ? 'text-slate-300 underline decoration-slate-600 underline-offset-4 hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
                    : 'font-medium text-white underline decoration-brand-400 underline-offset-4 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
                }
              >
                Política de Privacidade
              </Link>
            </nav>
            <p className="mt-8 text-sm italic leading-6 text-slate-500">
              Tecnologia para tornar o acompanhamento da rotina mais simples, consciente e conectado.
            </p>
          </div>
        </footer>
      </main>

      <button
        type="button"
        onClick={handleBackToTop}
        aria-label="Voltar ao topo"
        aria-hidden={!showBackToTop}
        tabIndex={showBackToTop ? 0 : -1}
        className={`fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-900/10 transition motion-reduce:transition-none hover:border-brand-200 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
          showBackToTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Voltar ao topo</span>
      </button>
    </div>
  )
}
