import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { WorkspaceSidebar } from '@/components/workspace-sidebar'
import { WorkspaceTopbar } from '@/components/workspace-topbar'
import { inferRoleFromPath, type WorkspaceVariant } from '@/lib/navigation'
import { useAppStore } from '@/store/app-store'

type WorkspaceLayoutProps = {
  variant: WorkspaceVariant
}

export function WorkspaceLayout({ variant }: WorkspaceLayoutProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const setRole = useAppStore((state) => state.setRole)

  useEffect(() => {
    setRole(inferRoleFromPath(location.pathname))
  }, [location.pathname, setRole])

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
      <div className="absolute left-[-10rem] top-[-4rem] h-80 w-80 rounded-full bg-brand-300/20 blur-3xl" />
      <div className="absolute bottom-[-8rem] right-[-5rem] h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative z-10 mx-auto grid w-full max-w-screen-2xl gap-5 xl:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-6 h-[calc(100vh-3rem)]">
            <WorkspaceSidebar variant={variant} />
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="mx-auto w-full max-w-7xl">
            <WorkspaceTopbar variant={variant} onOpenSidebar={() => setOpen(true)} />
          </div>
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="left-auto right-4 top-4 h-[calc(100vh-2rem)] w-[min(92vw,19rem)] translate-x-0 translate-y-0 p-0 sm:left-auto sm:right-6 sm:top-6 sm:w-[20rem]">
          <div className="h-full p-3">
            <WorkspaceSidebar variant={variant} onNavigate={() => setOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function PatientLayout() {
  return <WorkspaceLayout variant="patient" />
}

export function MedicalLayout() {
  return <WorkspaceLayout variant="medical" />
}

export function AdminLayout() {
  return <WorkspaceLayout variant="admin" />
}
