import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/page-loader'
import { AuthLayout } from '@/layouts/auth-layout'
import { AdminLayout, MedicalLayout, PatientLayout } from '@/layouts/workspace-layout'

const LandingPage = lazy(() =>
  import('@/pages/auth/landing-page').then((module) => ({ default: module.LandingPage })),
)
const TermsOfUsePage = lazy(() =>
  import('@/pages/auth/terms-of-use-page').then((module) => ({ default: module.TermsOfUsePage })),
)
const PrivacyPolicyPage = lazy(() =>
  import('@/pages/auth/privacy-policy-page').then((module) => ({
    default: module.PrivacyPolicyPage,
  })),
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
const CalendarPage = lazy(() =>
  import('@/pages/patient/calendar-page').then((module) => ({ default: module.CalendarPage })),
)
const ProfilePage = lazy(() =>
  import('@/pages/patient/profile-page').then((module) => ({ default: module.ProfilePage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/patient/settings-page').then((module) => ({ default: module.SettingsPage })),
)
const ProfessionalsPage = lazy(() =>
  import('@/pages/patient/professionals-page').then((module) => ({
    default: module.ProfessionalsPage,
  })),
)
const MedicalDashboardPage = lazy(() =>
  import('@/pages/medical/medical-dashboard-page').then((module) => ({
    default: module.MedicalDashboardPage,
  })),
)
const MedicalPatientsPage = lazy(() =>
  import('@/pages/medical/medical-patients-page').then((module) => ({
    default: module.MedicalPatientsPage,
  })),
)
const MedicalPatientPage = lazy(() =>
  import('@/pages/medical/medical-patient-page').then((module) => ({
    default: module.MedicalPatientPage,
  })),
)
const MedicalReportsPage = lazy(() =>
  import('@/pages/medical/medical-reports-page').then((module) => ({
    default: module.MedicalReportsPage,
  })),
)
const MedicalProfilePage = lazy(() =>
  import('@/pages/medical/medical-profile-page').then((module) => ({
    default: module.MedicalProfilePage,
  })),
)
const MedicalSettingsPage = lazy(() =>
  import('@/pages/medical/medical-settings-page').then((module) => ({
    default: module.MedicalSettingsPage,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/dashboard-page').then((module) => ({
    default: module.AdminDashboardPage,
  })),
)
const AdminUsersPage = lazy(() =>
  import('@/pages/admin/users-page').then((module) => ({
    default: module.AdminUsersPage,
  })),
)
const AdminSymptomsPage = lazy(() =>
  import('@/pages/admin/symptoms-page').then((module) => ({
    default: module.AdminSymptomsPage,
  })),
)
const AdminReportsPage = lazy(() =>
  import('@/pages/admin/reports-page').then((module) => ({
    default: module.AdminReportsPage,
  })),
)
const AdminAnalyticsPage = lazy(() =>
  import('@/pages/admin/analytics-page').then((module) => ({
    default: module.AdminAnalyticsPage,
  })),
)
const AdminSettingsPage = lazy(() =>
  import('@/pages/admin/settings-page').then((module) => ({
    default: module.AdminSettingsPage,
  })),
)
const MovementPage = lazy(() =>
  import('@/pages/patient/movement-page').then((module) => ({
    default: module.MovementPage,
  })),
)
const AiActivePreviewPage = lazy(() =>
  import('@/pages/shared/ai-active-preview-page').then((module) => ({
    default: module.AiActivePreviewPage,
  })),
)
const WorkspaceSearchPage = lazy(() =>
  import('@/pages/shared/workspace-search-page').then((module) => ({
    default: module.WorkspaceSearchPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/shared/not-found-page').then((module) => ({
    default: module.NotFoundPage,
  })),
)

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landingpage" element={<Navigate to="/" replace />} />
        <Route path="/termos-de-uso" element={<TermsOfUsePage />} />
        <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route element={<PatientLayout />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/ai-active" element={<AiActivePreviewPage />} />
          <Route path="/app/search" element={<WorkspaceSearchPage />} />
          <Route path="/app/assistant" element={<Navigate to="/app/movement" replace />} />
          <Route path="/app/pain-log" element={<PainLogPage />} />
          <Route path="/app/reports" element={<ReportsPage />} />
          <Route path="/app/movement" element={<MovementPage />} />
          <Route path="/app/calendar" element={<CalendarPage />} />
          <Route path="/app/community" element={<AiActivePreviewPage />} />
          <Route path="/app/professionals" element={<ProfessionalsPage />} />
          <Route path="/app/profile" element={<ProfilePage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
        </Route>

        <Route element={<MedicalLayout />}>
          <Route path="/medical" element={<MedicalDashboardPage />} />
          <Route path="/medical/patients" element={<MedicalPatientsPage />} />
          <Route path="/medical/patients/:patientId" element={<MedicalPatientPage />} />
          <Route path="/medical/reports" element={<MedicalReportsPage />} />
          <Route path="/medical/profile" element={<MedicalProfilePage />} />
          <Route path="/medical/settings" element={<MedicalSettingsPage />} />
          <Route path="/medical/ai-active" element={<AiActivePreviewPage />} />
          <Route path="/medical/search" element={<WorkspaceSearchPage />} />
        </Route>

        <Route path="/doctor/*" element={<DoctorWorkspaceRedirect />} />

        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/ai-active" element={<AiActivePreviewPage />} />
          <Route path="/admin/search" element={<WorkspaceSearchPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/symptoms" element={<AdminSymptomsPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

function DoctorWorkspaceRedirect() {
  const location = useLocation()
  const nextPathname = location.pathname.replace(/^\/doctor\b/, '/medical')

  return (
    <Navigate
      to={`${nextPathname}${location.search}${location.hash}`}
      replace
    />
  )
}
