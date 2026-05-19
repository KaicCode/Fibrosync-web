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
    <div className="relative min-h-screen overflow-hidden px-4 py-5 md:px-6 lg:px-8 lg:py-8">
      <div className="absolute left-[-10rem] top-[-4rem] h-80 w-80 rounded-full bg-brand-300/20 blur-3xl" />
      <div className="absolute bottom-[-8rem] right-[-5rem] h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-[1520px] gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-8 h-[calc(100vh-4rem)]">
            <WorkspaceSidebar variant={variant} />
          </div>
        </aside>

        <div className="min-w-0">
          <WorkspaceTopbar variant={variant} onOpenSidebar={() => setOpen(true)} />
          <Outlet />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="left-auto right-4 top-4 h-[calc(100vh-2rem)] w-[min(92vw,21rem)] translate-x-0 translate-y-0 p-0 sm:left-auto sm:right-6 sm:top-6 sm:w-[22rem]">
          <div className="h-full p-4">
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
