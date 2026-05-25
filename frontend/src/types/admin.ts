// Admin Types
export type AdminMetric = {
  label: string
  value: string | number
  trend?: number
  icon?: React.ComponentType<any>
}

export type AdminUser = {
  id: number
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  lastLogin?: string
  status: 'active' | 'inactive'
}

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

export type SymptomPattern = {
  symptom: string
  frequency: number
  avgIntensity: number
  trend: number
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
