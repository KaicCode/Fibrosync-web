import { type FormEvent, useMemo, useState } from 'react'
import { LogOut, Menu, Search, Sparkles } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InstallPwaButton } from '@/components/pwa/install-pwa-button'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { useUser } from '@/hooks/useUser'
import {
  workspaceAiActivePathByVariant,
  workspaceConfig,
  workspaceSearchPathByVariant,
  matchesNavigationItem,
  getActiveNavigationItem,
  type WorkspaceVariant,
} from '@/lib/navigation'
import { resolveRoleLabel } from '@/lib/user-role'
import {
  resolveCountryLabel,
  resolveUserAvatar,
  resolveUserDisplayName,
  resolveUserInitials,
} from '@/lib/user-profile'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

type WorkspaceTopbarProps = {
  variant: WorkspaceVariant
  onOpenSidebar: () => void
  isSidebarOpen: boolean
  sidebarId: string
}

export function WorkspaceTopbar({
  variant,
  onOpenSidebar,
  isSidebarOpen,
  sidebarId,
}: WorkspaceTopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const config = workspaceConfig[variant]
  const authSession = useAppStore((state) => state.authSession)
  const { user } = useUser()
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const currentUser = user ?? authSession?.user ?? null
  const isPatient = variant === 'patient'
  const activeItem = getActiveNavigationItem(config.navigation, location.pathname)
  const displayName = resolveUserDisplayName(currentUser)
  const searchPath = workspaceSearchPathByVariant[variant]
  const searchQueryFromRoute =
    location.pathname === searchPath ? searchParams.get('q')?.trim() ?? '' : ''
  const [searchDraft, setSearchDraft] = useState({
    locationKey: location.key,
    value: searchQueryFromRoute,
  })
  const userSubtitle = currentUser
    ? currentUser.countryCode
      ? `${resolveCountryLabel(currentUser.countryCode)}`
      : resolveRoleLabel(currentUser.role)
    : 'Paciente'
  const visibleSearchValue = searchDraft.locationKey === location.key
    ? searchDraft.value
    : searchQueryFromRoute

  const searchSuggestions = useMemo(
    () =>
      visibleSearchValue.trim()
        ? config.navigation.filter((item) => matchesNavigationItem(item, visibleSearchValue)).slice(0, 4)
        : [],
    [config.navigation, visibleSearchValue],
  )

  const showSuggestions = isSearchFocused && visibleSearchValue.trim().length > 0

  function handleSearchSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    const query = visibleSearchValue.trim()
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
    <header className={cn('sticky top-0 z-20 pt-1', isPatient && 'patient-workspace-topbar')}>
      <div className={cn('flex items-center gap-3 rounded-[1.6rem] border border-white/70 bg-white/74 px-3.5 py-3 shadow-soft backdrop-blur-2xl md:px-5', isPatient && 'flex-wrap xl:flex-nowrap')}>
        <Button
          id={`${sidebarId}-trigger`}
          type="button"
          variant="secondary"
          size="icon"
          className={cn('xl:hidden', isPatient && 'h-11 w-11 shrink-0')}
          onClick={onOpenSidebar}
          aria-label="Abrir menu de navegação"
          aria-haspopup="dialog"
          aria-expanded={isSidebarOpen}
          aria-controls={sidebarId}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {isPatient ? (
          <div className="flex min-w-0 flex-1 items-center gap-3 xl:hidden">
            <BrandLogo compact />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">FibroSync</p>
              <p className="truncate text-xs text-muted-foreground">
                {activeItem?.label ?? config.shortLabel}
              </p>
            </div>
          </div>
        ) : null}

        <div
          className={cn('relative hidden flex-1 md:block', isPatient && 'order-last block basis-full xl:order-none xl:basis-auto')}
          onFocusCapture={() => setIsSearchFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsSearchFocused(false)
            }
          }}
        >
          <form onSubmit={handleSearchSubmit} role="search" aria-label={config.searchPlaceholder}>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={visibleSearchValue}
              onChange={(event) => {
                setSearchDraft({ locationKey: location.key, value: event.target.value })
                setIsSearchFocused(true)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setIsSearchFocused(false)
                }
              }}
              className={cn('h-12 rounded-full border-white/80 bg-white/84 pl-11 pr-4 shadow-soft', isPatient && 'pr-14 text-base xl:pr-4 xl:text-sm')}
              placeholder={config.searchPlaceholder}
              aria-label={config.searchPlaceholder}
              enterKeyHint="search"
            />
            <button
              type="submit"
              className={isPatient
                ? 'absolute right-0.5 top-0.5 flex h-11 w-11 items-center justify-center rounded-full text-brand-700 outline-none transition hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-ring xl:sr-only'
                : 'sr-only'}
              aria-label="Buscar"
            >
              {isPatient ? <Search className="h-4 w-4 xl:hidden" aria-hidden="true" /> : null}
              <span className={isPatient ? 'sr-only' : undefined}>Buscar</span>
            </button>
          </form>

          {showSuggestions ? (
            <div className={cn('absolute inset-x-0 top-[calc(100%+0.6rem)] z-30 overflow-hidden rounded-[1.4rem] border border-white/80 bg-white/94 p-2 shadow-panel backdrop-blur-2xl', isPatient && 'max-xl:max-h-[50dvh] max-xl:overflow-y-auto max-xl:overscroll-contain')}>
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
                    Buscar por "{visibleSearchValue.trim()}"
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

        <div className={cn('ml-auto flex items-center gap-3', isPatient && 'hidden xl:flex')}>
          <Badge className="hidden bg-brand-50/90 px-3 py-1.5 text-brand-700 shadow-soft md:inline-flex">
            {config.shortLabel} mode
          </Badge>
          <WorkspaceNavigationActions variant={variant} />
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

export function WorkspaceNavigationActions({
  variant,
  mobile = false,
  onNavigate,
}: {
  variant: WorkspaceVariant
  mobile?: boolean
  onNavigate?: () => void
}) {
  const navigate = useNavigate()
  const { logout, isLoggingOut } = useAuth()

  return (
    <>
      <Button
        type="button"
        variant="soft"
        size="sm"
        className={cn('shrink-0', mobile && 'min-h-11 flex-1')}
        onClick={() => {
          navigate(workspaceAiActivePathByVariant[variant])
          onNavigate?.()
        }}
      >
        <Sparkles className="h-4 w-4" />
        IA ativa
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={cn('shrink-0', mobile && 'min-h-11 flex-1')}
        disabled={isLoggingOut}
        onClick={() => {
          void logout()
        }}
      >
        <LogOut className="h-4 w-4" />
        {isLoggingOut ? 'Saindo...' : 'Sair'}
      </Button>
      <InstallPwaButton
        variant="compact"
        className={mobile ? 'min-h-11 w-full' : undefined}
      />
    </>
  )
}
