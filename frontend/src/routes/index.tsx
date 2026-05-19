import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PageLoader } from '@/components/page-loader'
import { AuthLayout } from '@/layouts/auth-layout'
import { AdminLayout, MedicalLayout, PatientLayout } from '@/layouts/workspace-layout'

const LandingPage = lazy(() =>
  import('@/pages/auth/landing-page').then((module) => ({ default: module.LandingPage })),
)
const LoginPage = lazy(() =>
  import('@/pages/auth/login-page').then((module) => ({ default: module.LoginPage })),
)
const SignupPage = lazy(() =>
  import('@/pages/auth/signup-page').then((module) => ({ default: module.SignupPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/patient/dashboard-page').then((module) => ({ default: module.DashboardPage })),
)
const PainLogPage = lazy(() =>
  import('@/pages/patient/pain-log-page').then((module) => ({ default: module.PainLogPage })),
)
const ReportsPage = lazy(() =>
  import('@/pages/patient/reports-page').then((module) => ({ default: module.ReportsPage })),
)
const AssistantPage = lazy(() =>
  import('@/pages/patient/assistant-page').then((module) => ({ default: module.AssistantPage })),
)
const CalendarPage = lazy(() =>
  import('@/pages/patient/calendar-page').then((module) => ({ default: module.CalendarPage })),
)
const CommunityPage = lazy(() =>
  import('@/pages/patient/community-page').then((module) => ({ default: module.CommunityPage })),
)
const ProfilePage = lazy(() =>
  import('@/pages/patient/profile-page').then((module) => ({ default: module.ProfilePage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/patient/settings-page').then((module) => ({ default: module.SettingsPage })),
)
const MedicalDashboardPage = lazy(() =>
  import('@/pages/medical/medical-dashboard-page').then((module) => ({
    default: module.MedicalDashboardPage,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/admin-dashboard-page').then((module) => ({
    default: module.AdminDashboardPage,
  })),
)

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/landingpage" element={<LandingPage />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route element={<PatientLayout />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/pain-log" element={<PainLogPage />} />
          <Route path="/app/reports" element={<ReportsPage />} />
          <Route path="/app/assistant" element={<AssistantPage />} />
          <Route path="/app/calendar" element={<CalendarPage />} />
          <Route path="/app/community" element={<CommunityPage />} />
          <Route path="/app/profile" element={<ProfilePage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
        </Route>

        <Route element={<MedicalLayout />}>
          <Route path="/medical" element={<MedicalDashboardPage />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
