import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6 md:py-8 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(123,77,255,0.14),transparent_62%)]" />
      <div className="absolute right-[-8rem] top-24 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="absolute bottom-0 left-[-6rem] h-72 w-72 rounded-full bg-brand-300/20 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-[1480px]">
        <Outlet />
      </div>
    </main>
  )
}
