import { ArrowRightLeft, ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  isNavigationItemActive,
  roleOptions,
  workspaceConfig,
  type WorkspaceVariant,
} from '@/lib/navigation'
import { useAppStore } from '@/store/app-store'

type WorkspaceSidebarProps = {
  variant: WorkspaceVariant
  onNavigate?: () => void
}

export function WorkspaceSidebar({
  variant,
  onNavigate,
}: WorkspaceSidebarProps) {
  const config = workspaceConfig[variant]
  const currentRole = variant
  const location = useLocation()
  const authSession = useAppStore((state) => state.authSession)
  const canAccessAdmin = authSession?.user.role === 'ADMIN'
  const navigationItems =
    variant === 'patient' && authSession?.user.role === 'ADMIN'
      ? config.navigation.filter((item) => item.to !== '/app/professionals')
      : config.navigation

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,243,255,0.92))] shadow-panel backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        <div className="absolute right-[-3rem] top-[-2rem] h-28 w-28 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="absolute bottom-[-2rem] left-[-1rem] h-24 w-24 rounded-full bg-sky-300/20 blur-3xl" />
      </div>

      <div className="relative flex h-full min-h-0 flex-col gap-4 p-3.5">
        <div className="rounded-[1.45rem] border border-white/75 bg-white/72 px-3.5 py-3 shadow-soft backdrop-blur-xl">
          <BrandLogo className="min-w-0" />
        </div>

        <div className="flex items-center justify-between px-1">
          <p className="section-label">Navegação</p>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
            {navigationItems.length} áreas
          </p>
        </div>

        <nav className="scrollbar-subtle flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          {navigationItems.map((item) => {
            const isActive = isNavigationItemActive(item, location.pathname)

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group rounded-[1.15rem] border px-3 py-2.5 text-sm outline-none transition-all duration-300 hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
                  isActive
                    ? 'border-brand-300/40 bg-[linear-gradient(135deg,rgba(123,77,255,0.16),rgba(92,135,255,0.12))] text-foreground shadow-[0_18px_46px_rgba(123,77,255,0.16)]'
                    : 'border-transparent bg-white/55 text-muted-foreground hover:border-white/80 hover:bg-white/80 hover:text-foreground hover:shadow-soft',
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
                      isActive
                        ? 'bg-brand-gradient text-white shadow-glow'
                        : 'bg-white text-muted-foreground shadow-soft group-hover:text-brand-700',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold tracking-[-0.02em] text-current">
                        {item.label}
                      </p>
                      {item.badge ? (
                        <Badge className="bg-brand-100/90 px-2 py-0.5 text-[0.65rem] text-brand-700 shadow-none">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </div>
                    {isActive ? (
                      <p className="mt-0.5 truncate text-[11px] text-foreground/70">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  <ChevronRight
                    className={cn(
                      'h-4 w-4 shrink-0 transition-all duration-300',
                      isActive
                        ? 'translate-x-0 text-brand-700'
                        : 'translate-x-1 text-muted-foreground/60 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
                    )}
                  />
                </div>
              </Link>
            )
          })}
        </nav>

        {variant === 'admin' && canAccessAdmin ? (
          <div className="shrink-0 rounded-[1.35rem] border border-white/75 bg-white/78 p-3 shadow-soft backdrop-blur-xl">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/85">
                  Alternar contexto
                </p>
                <p className="text-xs text-muted-foreground">Paciente, médico, admin</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {roleOptions.map((option) => (
                <Link
                  key={option.role}
                  to={option.href}
                  onClick={onNavigate}
                  aria-current={currentRole === option.role ? 'page' : undefined}
                  className={cn(
                    'group flex flex-col items-center justify-center gap-1 rounded-[1rem] border px-2 py-2.5 text-center outline-none transition-all duration-300 hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
                    currentRole === option.role
                      ? 'border-brand-300/45 bg-[linear-gradient(135deg,rgba(123,77,255,0.16),rgba(92,135,255,0.1))] shadow-soft'
                      : 'border-transparent bg-brand-50/50 hover:border-white/80 hover:bg-white',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
                      currentRole === option.role
                        ? 'bg-brand-gradient text-white'
                        : 'bg-white text-muted-foreground shadow-soft group-hover:text-brand-700',
                    )}
                  >
                    <option.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold tracking-[-0.02em] text-foreground">
                    {option.label}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
