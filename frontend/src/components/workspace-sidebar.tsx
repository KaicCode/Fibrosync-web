import { ArrowRightLeft, ChevronRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
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
  const currentRole = useAppStore((state) => state.role)
  const setRole = useAppStore((state) => state.setRole)

  return (
    <div className="flex h-full flex-col gap-6 rounded-[2rem] border border-white/70 bg-white/86 p-5 shadow-panel backdrop-blur-xl">
      <BrandLogo />

      <div className="rounded-[1.7rem] bg-brand-gradient p-[1px] shadow-glow">
        <div className="rounded-[1.65rem] bg-white/95 px-4 py-4">
          <Badge className="mb-3 w-fit" variant="default">
            FibroSync Care OS
          </Badge>
          <p className="text-base font-semibold tracking-[-0.04em] text-foreground">
            {config.label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Navegação desenhada para um fluxo de cuidado leve, claro e contínuo.
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {config.navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center justify-between rounded-[1.25rem] px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-300',
                isActive
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'hover:bg-brand-50/80 hover:text-brand-700',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-2xl transition-all',
                      isActive ? 'bg-white/16' : 'bg-white shadow-soft group-hover:bg-white',
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </div>
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={cn('h-4 w-4 transition-transform', isActive ? 'translate-x-0' : 'translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100')} />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-[1.6rem] border border-white/80 bg-white/80 p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-brand-600" />
          <p className="text-sm font-semibold text-foreground">Alternar contexto</p>
        </div>
        <div className="grid gap-2">
          {roleOptions.map((option) => (
            <Button
              key={option.role}
              asChild
              size="sm"
              variant={currentRole === option.role ? 'default' : 'secondary'}
              onClick={() => setRole(option.role)}
            >
              <NavLink to={option.href} onClick={onNavigate}>
                {option.label}
              </NavLink>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
