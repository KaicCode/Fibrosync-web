import { Bell, Menu, Search, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
    <header className="sticky top-0 z-20 mb-8 flex items-center gap-4 rounded-[1.8rem] border border-white/70 bg-white/72 px-4 py-3 backdrop-blur-xl md:px-6">
      <Button
        variant="secondary"
        size="icon"
        className="xl:hidden"
        onClick={onOpenSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative hidden flex-1 md:block">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-12 rounded-full pl-10" placeholder={config.searchPlaceholder} />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button variant="soft" size="sm" className="hidden md:inline-flex">
          <Sparkles className="h-4 w-4" />
          IA ativa
        </Button>
        <Button variant="secondary" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="hidden items-center gap-3 rounded-full border border-white/80 bg-white/85 px-2 py-2 shadow-soft sm:flex">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://i.pravatar.cc/120?img=44" alt="Juliana Santos" />
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
          <div className="pr-2">
            <p className="text-sm font-semibold text-foreground">Juliana Santos</p>
            <p className="text-xs text-muted-foreground">Plano Premium Care</p>
          </div>
        </div>
      </div>
    </header>
  )
}
