import type { LucideIcon } from 'lucide-react'

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
  role: 'USER' | 'ADMIN'
  birthDate?: string | null
  gender?: string | null
  heightCm?: number | null
  weightKg?: number | null
  countryCode?: string | null
  timezone: string
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string | null
  lastLoginAt?: string | null
  status: 'active' | 'inactive'
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
  role: 'USER' | 'ADMIN'
  birthDate?: string
  gender?: string
  heightCm?: number
  weightKg?: number
  countryCode?: string
  timezone?: string
  onboardingCompleted?: boolean
}

export type AdminUpdateUserInput = Omit<
  Partial<AdminCreateUserInput>,
  'birthDate' | 'gender' | 'countryCode' | 'timezone'
> & {
  birthDate?: string | null
  gender?: string | null
  countryCode?: string | null
  timezone?: string | null
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

export type AdminDashboardSummary = {
  totalUsers: number
  activeUsers: number
  totalRecords: number
  systemHealth: string
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
