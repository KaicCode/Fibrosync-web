import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/page-loader'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { WorkspaceSidebar } from '@/components/workspace-sidebar'
import { WorkspaceTopbar } from '@/components/workspace-topbar'
import {
  buildAuthSession,
  clearStoredAuthTokens,
  getStoredAccessToken,
  storeAuthTokens,
} from '@/lib/auth-session'
import type { WorkspaceVariant } from '@/lib/navigation'
import {
  canAccessAdminWorkspace,
  canAccessMedicalWorkspace,
  canAccessPatientWorkspace,
  resolveHomePathByRole,
} from '@/lib/user-role'
import { performTokenRefresh } from '@/lib/session-refresh'
import { useAppStore } from '@/store/app-store'

type WorkspaceLayoutProps = {
  variant: WorkspaceVariant
}

type GuardStatus = 'checking' | 'ready' | 'unauthenticated'

export function WorkspaceLayout({ variant }: WorkspaceLayoutProps) {
  const [mobileSidebarPath, setMobileSidebarPath] = useState<string | null>(null)
  const location = useLocation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isMobileSidebarOpen = mobileSidebarPath === location.pathname

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="relative min-h-screen overflow-hidden xl:h-screen">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10rem] top-[-4rem] h-80 w-80 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-5rem] h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute left-[18%] top-[10%] h-44 w-44 rounded-full bg-brand-400/10 blur-3xl" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[18.75rem] p-4 xl:block 2xl:w-[19.5rem] 2xl:p-5">
        <WorkspaceSidebar variant={variant} />
      </aside>

      <div
        ref={scrollContainerRef}
        className="scrollbar-subtle relative z-10 min-h-screen xl:ml-[18.75rem] xl:h-screen xl:overflow-y-auto 2xl:ml-[19.5rem]"
      >
        <div className="px-4 py-4 md:px-6 md:py-5 xl:px-6 xl:py-6 2xl:px-8">
          <div className="mx-auto flex w-full max-w-screen-2xl min-w-0 flex-col gap-5">
            <WorkspaceTopbar
              variant={variant}
              onOpenSidebar={() => setMobileSidebarPath(location.pathname)}
            />
            <main className="min-w-0 pb-6 xl:pb-10">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      <Dialog
        open={isMobileSidebarOpen}
        onOpenChange={(nextOpen) =>
          setMobileSidebarPath(nextOpen ? location.pathname : null)
        }
      >
        <DialogContent className="left-auto right-4 top-4 h-[calc(100vh-2rem)] w-[min(92vw,18.75rem)] translate-x-0 translate-y-0 overflow-hidden border-white/60 bg-white/75 p-0 shadow-panel backdrop-blur-2xl sm:left-auto sm:right-5 sm:top-5 sm:w-[18.75rem]">
          <div className="h-full p-3">
            <WorkspaceSidebar
              variant={variant}
              onNavigate={() => setMobileSidebarPath(null)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function PatientLayout() {
  return (
    <ProtectedWorkspaceLayout
      variant="patient"
      canAccessVariant={canAccessPatientWorkspace}
    />
  )
}

export function MedicalLayout() {
  return (
    <ProtectedWorkspaceLayout
      variant="medical"
      canAccessVariant={canAccessMedicalWorkspace}
    />
  )
}

export function AdminLayout() {
  return (
    <ProtectedWorkspaceLayout
      variant="admin"
      canAccessVariant={canAccessAdminWorkspace}
    />
  )
}

function ProtectedWorkspaceLayout({
  variant,
  canAccessVariant,
}: WorkspaceLayoutProps & {
  canAccessVariant: (role?: string | null) => boolean
}) {
  const location = useLocation()
  const authSession = useAppStore((state) => state.authSession)
  const setAuthSession = useAppStore((state) => state.setAuthSession)
  const clearAuthSession = useAppStore((state) => state.clearAuthSession)
  const isAuthenticated = Boolean(authSession && getStoredAccessToken())
  const [status, setStatus] = useState<GuardStatus>(() =>
    isAuthenticated ? 'ready' : 'checking',
  )

  // F-14: the access token lives only in memory and does not survive a
  // page reload, and the refresh token is an httpOnly cookie invisible to
  // this code — so there is no client-side flag to check for "was logged
  // in" any more. Every mount without an in-memory session attempts one
  // silent refresh against the httpOnly cookie; a guest (no valid cookie)
  // simply gets a fast 401 and is redirected to /login as before.
  useEffect(() => {
    // Already authenticated at mount time (e.g. navigating here right
    // after login within the same SPA session) — the initial `status`
    // state above already accounts for this, nothing else to do.
    if (isAuthenticated) {
      return
    }

    let isCancelled = false

    const restoreSession = async () => {
      try {
        setStatus('checking')
        const session = await performTokenRefresh()

        if (isCancelled) {
          return
        }

        storeAuthTokens({ accessToken: session.accessToken })
        setAuthSession(buildAuthSession(session.accessToken, session.user))
        setStatus('ready')
      } catch {
        if (isCancelled) {
          return
        }

        clearStoredAuthTokens()
        clearAuthSession()
        setStatus('unauthenticated')
      }
    }

    void restoreSession()

    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'checking') {
    return <PageLoader />
  }

  if (status === 'unauthenticated' || !authSession) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!canAccessVariant(authSession.user.role)) {
    return (
      <Navigate to={resolveHomePathByRole(authSession.user.role)} replace />
    )
  }

  return <WorkspaceLayout variant={variant} />
}
