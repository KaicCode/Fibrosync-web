import type { LucideIcon } from 'lucide-react'
import type { AccountStatus, ApiUserRole } from '@/lib/user-role'

// Admin Types
export type AdminMetric = {
  label: string
  value: string | number
  trend?: number
  icon?: LucideIcon
}

export type AdminUser = {
  id: string
  name: string
  fullName: string
  email: string
  role: ApiUserRole
  accountStatus: AccountStatus
  birthDate?: string | null
  gender?: string | null
  heightCm?: number | null
  weightKg?: number | null
  countryCode?: string | null
  timezone: string
  specialty?: string | null
  professionalCouncilType?: string | null
  professionalCouncilNumber?: string | null
  professionalCouncilState?: string | null
  professionalPhone?: string | null
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string | null
  lastLoginAt?: string | null
}

export type AdminUsersListResponse = {
  items: AdminUser[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type AdminCreateUserInput = {
  email: string
  password: string
  fullName: string
  role: ApiUserRole
  birthDate?: string
  gender?: string
  heightCm?: number
  weightKg?: number
  countryCode?: string
  timezone?: string
  specialty?: string
  professionalCouncilType?: string
  professionalCouncilNumber?: string
  professionalCouncilState?: string
  professionalPhone?: string
  onboardingCompleted?: boolean
}

export type AdminUpdateUserInput = Omit<
  Partial<AdminCreateUserInput>,
  | 'birthDate'
  | 'gender'
  | 'countryCode'
  | 'timezone'
  | 'specialty'
  | 'professionalCouncilType'
  | 'professionalCouncilNumber'
  | 'professionalCouncilState'
  | 'professionalPhone'
> & {
  birthDate?: string | null
  gender?: string | null
  countryCode?: string | null
  timezone?: string | null
  specialty?: string | null
  professionalCouncilType?: string | null
  professionalCouncilNumber?: string | null
  professionalCouncilState?: string | null
  professionalPhone?: string | null
}

export type AdminSymptomRecord = {
  id: string
  userId: string
  dailyRecordId?: string | null
  fatigueLevel: number
  sleepQuality: number
  stiffness: number
  mood: number
  stress: number
  cognitiveFog: boolean
  sensitivityLight: boolean
  sensitivityNoise: boolean
  digestiveIssues: boolean
  headache: boolean
  anxiety: boolean
  depression: boolean
  bodyTemperatureFeeling?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    fullName: string
    email: string
  }
}

export type AdminSymptomsListResponse = {
  items: AdminSymptomRecord[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type AdminCreateSymptomInput = {
  userId: string
  fatigueLevel: number
  sleepQuality: number
  stiffness: number
  mood: number
  stress: number
  cognitiveFog?: boolean
  sensitivityLight?: boolean
  sensitivityNoise?: boolean
  digestiveIssues?: boolean
  headache?: boolean
  anxiety?: boolean
  depression?: boolean
  bodyTemperatureFeeling?: string
  notes?: string
}

export type AdminUpdateSymptomInput = Partial<
  Omit<AdminCreateSymptomInput, 'userId'>
>

export type CrisisAlert = {
  id: number
  userId: number
  userName: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  trigger: string
  timestamp: string
}

export type TriggerAnalytics = {
  name: string
  count: number
  percentage: number
  trend: number
}

export type TriggerStat = {
  name: string
  count: number
}

export type SymptomPattern = {
  symptom: string
  frequency: number
  avgIntensity: number
  trend: number
}

export type SymptomCorrelationStat = {
  symptom1: string
  symptom2: string
  correlation: number
  frequency: number
}

export type RecurringPatternStat = {
  id: string
  label: string
  count: number
  description?: string
  trend?: number
}

export type DailyRecordMetric = {
  date: string
  total: number
  avgAdherence: number
}

export type PredictionRecord = {
  id: number
  userId: number
  riskScore: number
  predictedTriggers: string[]
  timestamp: string
  accuracy?: number
}

export type AdminDashboardMetrics = {
  totalUsers: number
  activeUsers: number
  averageCrisisRisk: number
  mostCommonTrigger: string
  adherenceRate: number
  avgSymptomPatterns: SymptomPattern[]
  dailyRecordsCount: number
  predictionHistoryCount: number
}

export type AdminDashboardPeriodOption = 7 | 30 | 90

export type AdminDashboardIssueSection =
  | 'overview'
  | 'growth'
  | 'activity'
  | 'professionals'
  | 'recentActivity'
  | 'pending'
  | 'platformStatus'

export type AdminDashboardIssue = {
  section: AdminDashboardIssueSection
  message: string
}

export type AdminDashboardOverview = {
  totalUsers: number
  patients: number
  professionals: number
  admins: number
  activeUsers: number
  activeUsersDefinition: string
  newUsersInPeriod: number
  newUsersPreviousPeriod: number
  newUsersChangePercent: number | null
}

export type AdminDashboardDistribution = {
  patients: number
  professionals: number
  admins: number
}

export type AdminDashboardGrowthPoint = {
  date: string
  total: number
  patients: number
  professionals: number
}

export type AdminDashboardGrowth = {
  series: AdminDashboardGrowthPoint[]
}

export type AdminDashboardActivityPoint = {
  date: string
  total: number
}

export type AdminDashboardActivity = {
  totalRecords: number
  recordsInPeriod: number
  patientsWithRecordsInPeriod: number
  series: AdminDashboardActivityPoint[]
}

export type AdminDashboardPendingProfessional = {
  id: string
  fullName: string
  specialty: string | null
  createdAt: string
  accountStatus: 'PENDING_PROFILE'
}

export type AdminDashboardProfessionals = {
  total: number
  active: number
  pending: number
  suspended: number
  pendingItems: AdminDashboardPendingProfessional[]
}

export type AdminDashboardRecentActivityItem = {
  id: string
  type: 'USER_CREATED' | 'PROFESSIONAL_COMPLETED_PROFILE'
  title: string
  description: string
  occurredAt: string
}

export type AdminDashboardRecentActivity = {
  items: AdminDashboardRecentActivityItem[]
}

export type AdminDashboardPendingItem = {
  id: string
  title: string
  description: string
  status: string
}

export type AdminDashboardPending = {
  items: AdminDashboardPendingItem[]
}

export type AdminDashboardPlatformStatus = {
  api: 'operational'
  database: 'operational'
  checkedAt: string
}

export type AdminDashboardSummary = {
  generatedAt: string
  periodDays: AdminDashboardPeriodOption
  activeUsersWindowDays: number
  overview: AdminDashboardOverview | null
  distribution: AdminDashboardDistribution | null
  growth: AdminDashboardGrowth | null
  activity: AdminDashboardActivity | null
  professionals: AdminDashboardProfessionals | null
  recentActivity: AdminDashboardRecentActivity | null
  pending: AdminDashboardPending | null
  platformStatus: AdminDashboardPlatformStatus | null
  issues: AdminDashboardIssue[]
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export type AnalyticsResponse = {
  triggers: TriggerAnalytics[]
  symptoms: SymptomPattern[]
  dailyRecords: DailyRecordMetric[]
  predictions: PredictionRecord[]
}

export type ReportMetrics = {
  generatedReports: number
  failedReports: number
  lastGeneratedAt?: string | null
}

export type AdminReport = {
  id: string
  name: string
  type: 'users' | 'crisis' | 'analytics'
  generatedAt: string
  format: 'json' | 'pdf'
  url?: string
}

export type AdminReportDocumentSummaryItem = {
  label: string
  value: string
}

export type AdminReportDocumentSection = {
  title: string
  lines: string[]
}

export type AdminReportDocument = {
  title: string
  reportLabel: string
  generatedAt: string
  generatedBy?: string | null
  periodLabel?: string | null
  summary: AdminReportDocumentSummaryItem[]
  sections: AdminReportDocumentSection[]
}

export type AdminReportHistoryItem = AdminReport & {
  fileName: string
  generatedBy?: string | null
  document: AdminReportDocument
  payload: unknown
}

export type AISettings = {
  enabled: boolean
  riskThreshold: number
  predictionAccuracy: number
  updateFrequency: 'daily' | 'weekly' | 'monthly'
}

export type NotificationSettings = {
  crisisAlerts: boolean
  adherenceReminders: boolean
  systemNotifications: boolean
  emailNotifications: boolean
  smsNotifications: boolean
}

export type RiskLimits = {
  criticalThreshold: number
  highThreshold: number
  mediumThreshold: number
  checkFrequency: number // in hours
}
