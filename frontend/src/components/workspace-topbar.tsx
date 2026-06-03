import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Menu, Search, Sparkles } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUser } from '@/hooks/useUser'
import {
  workspaceAiActivePathByVariant,
  workspaceConfig,
  workspaceSearchPathByVariant,
  matchesNavigationItem,
  type WorkspaceVariant,
} from '@/lib/navigation'
import {
  resolveCountryLabel,
  resolveUserAvatar,
  resolveUserDisplayName,
  resolveUserInitials,
} from '@/lib/user-profile'
import { useAppStore } from '@/store/app-store'

type WorkspaceTopbarProps = {
  variant: WorkspaceVariant
  onOpenSidebar: () => void
}

export function WorkspaceTopbar({
  variant,
  onOpenSidebar,
}: WorkspaceTopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const config = workspaceConfig[variant]
  const authSession = useAppStore((state) => state.authSession)
  const { user } = useUser()
  const [searchDraft, setSearchDraft] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const currentUser = user ?? authSession?.user ?? null
  const displayName = resolveUserDisplayName(currentUser)
  const searchPath = workspaceSearchPathByVariant[variant]
  const searchQueryFromRoute =
    location.pathname === searchPath ? searchParams.get('q')?.trim() ?? '' : ''
  const userSubtitle = currentUser
    ? currentUser.countryCode
      ? `${resolveCountryLabel(currentUser.countryCode)}`
      : currentUser.role === 'ADMIN'
        ? 'Administrador'
        : 'Paciente'
    : 'Paciente'

  useEffect(() => {
    setSearchDraft(searchQueryFromRoute)
  }, [searchQueryFromRoute])

  const searchSuggestions = useMemo(
    () =>
      searchDraft.trim()
        ? config.navigation.filter((item) => matchesNavigationItem(item, searchDraft)).slice(0, 4)
        : [],
    [config.navigation, searchDraft],
  )

  const showSuggestions = isSearchFocused && searchDraft.trim().length > 0

  function handleSearchSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    const query = searchDraft.trim()
    if (!query) {
      return
    }

    navigate(`${searchPath}?q=${encodeURIComponent(query)}`)
    setIsSearchFocused(false)
  }

  function handleDirectNavigation(target: string) {
    navigate(target)
    setIsSearchFocused(false)
  }

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

        <div
          className="relative hidden flex-1 md:block"
          onFocusCapture={() => setIsSearchFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsSearchFocused(false)
            }
          }}
        >
          <form onSubmit={handleSearchSubmit}>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setIsSearchFocused(false)
                }
              }}
              className="h-12 rounded-full border-white/80 bg-white/84 pl-11 pr-4 shadow-soft"
              placeholder={config.searchPlaceholder}
            />
            <button type="submit" className="sr-only">
              Buscar
            </button>
          </form>

          {showSuggestions ? (
            <div className="absolute inset-x-0 top-[calc(100%+0.6rem)] z-30 overflow-hidden rounded-[1.4rem] border border-white/80 bg-white/94 p-2 shadow-panel backdrop-blur-2xl">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSearchSubmit()}
                className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left transition hover:bg-brand-50/80"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Search className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    Buscar por "{searchDraft.trim()}"
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Ver resultados em todo o contexto atual
                  </p>
                </div>
              </button>

              {searchSuggestions.length > 0 ? (
                <div className="mt-1 border-t border-slate-100 pt-1">
                  {searchSuggestions.map((item) => (
                    <button
                      key={item.to}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleDirectNavigation(item.to)}
                      className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left transition hover:bg-brand-50/70"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.label}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                  Nenhum atalho direto encontrado. Pressione Enter para ver resultados.
                </p>
              )}
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Badge className="hidden bg-brand-50/90 px-3 py-1.5 text-brand-700 shadow-soft md:inline-flex">
            {config.shortLabel} mode
          </Badge>
          <Button
            variant="soft"
            size="sm"
            className="shrink-0"
            onClick={() => navigate(workspaceAiActivePathByVariant[variant])}
          >
            <Sparkles className="h-4 w-4" />
            IA ativa
          </Button>
          <div className="hidden items-center gap-3 rounded-full border border-white/80 bg-white/88 px-2 py-1.5 shadow-soft lg:flex">
            <Avatar className="h-9 w-9">
              <AvatarImage src={resolveUserAvatar(currentUser)} alt={displayName} />
              <AvatarFallback>{resolveUserInitials(currentUser)}</AvatarFallback>
            </Avatar>
            <div className="pr-2">
              <p className="text-sm font-semibold text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{userSubtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
