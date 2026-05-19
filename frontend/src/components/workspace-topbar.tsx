import { Bell, Menu, Search, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { workspaceConfig, type WorkspaceVariant } from '@/lib/navigation'

type WorkspaceTopbarProps = {
  variant: WorkspaceVariant
  onOpenSidebar: () => void
}

export function WorkspaceTopbar({
  variant,
  onOpenSidebar,
}: WorkspaceTopbarProps) {
  const config = workspaceConfig[variant]

  return (
    <header className="sticky top-0 z-20 pt-1">
      <div className="flex items-center gap-3 rounded-[1.6rem] border border-white/70 bg-white/74 px-3.5 py-3 shadow-soft backdrop-blur-2xl md:px-5">
        <Button
          variant="secondary"
          size="icon"
          className="xl:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden rounded-full border border-white/80 bg-white/86 px-3 py-2 shadow-soft lg:flex lg:items-center lg:gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(74,222,128,0.16)]" />
          <div className="leading-none">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
              Workspace
            </p>
            <p className="mt-1 text-sm font-semibold tracking-[-0.03em] text-foreground">
              {config.shortLabel}
            </p>
          </div>
        </div>

        <div className="relative hidden flex-1 md:block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 rounded-full border-white/80 bg-white/84 pl-11 shadow-soft"
            placeholder={config.searchPlaceholder}
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Badge className="hidden bg-brand-50/90 px-3 py-1.5 text-brand-700 shadow-soft md:inline-flex">
            {config.shortLabel} mode
          </Badge>
          <Button variant="soft" size="sm" className="hidden md:inline-flex">
            <Sparkles className="h-4 w-4" />
            IA ativa
          </Button>
          <Button variant="secondary" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="hidden items-center gap-3 rounded-full border border-white/80 bg-white/88 px-2 py-1.5 shadow-soft lg:flex">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://i.pravatar.cc/120?img=44" alt="Juliana Santos" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
            <div className="pr-2">
              <p className="text-sm font-semibold text-foreground">Juliana Santos</p>
              <p className="text-xs text-muted-foreground">Plano Premium Care</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
