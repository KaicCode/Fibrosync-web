import type {
  AdminDashboardMetrics,
  AdminUser,
  AnalyticsResponse,
  CrisisAlert,
  PaginatedResponse,
  PredictionRecord,
  AdminReport,
  AISettings,
  NotificationSettings,
  RiskLimits,
  TriggerAnalytics,
  TriggerStat,
  SymptomCorrelationStat,
  RecurringPatternStat,
} from '@/types/admin'
import { resolveApiUrl } from '@/lib/resolve-api-url'

const API_URL = resolveApiUrl()

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
  statusCode: number
}

// Helper function to make authenticated requests
async function authenticatedFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const token = localStorage.getItem('accessToken')

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  const body = (await response.json()) as ApiResponse<T>

  if (!body.success) {
    throw new Error(body.message || 'Request failed')
  }

  return body.data
}

// Dashboard Metrics
export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  return authenticatedFetch<AdminDashboardMetrics>('/admin/metrics')
}

export async function getCrisisAlerts(
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<CrisisAlert>> {
  return authenticatedFetch<PaginatedResponse<CrisisAlert>>(
    `/admin/crisis-alerts?page=${page}&limit=${limit}`,
  )
}

// Users Management
export async function getAdminUsers(
  page = 1,
  limit = 10,
  search?: string,
): Promise<PaginatedResponse<AdminUser>> {
  let endpoint = `/admin/users?page=${page}&limit=${limit}`
  if (search) {
    endpoint += `&search=${encodeURIComponent(search)}`
  }
  return authenticatedFetch<PaginatedResponse<AdminUser>>(endpoint)
}

export async function getUserDetails(userId: number): Promise<AdminUser> {
  return authenticatedFetch<AdminUser>(`/admin/users/${userId}`)
}

export async function updateUserRole(
  userId: number,
  role: 'USER' | 'ADMIN',
): Promise<AdminUser> {
  return authenticatedFetch<AdminUser>(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

export async function deactivateUser(userId: number): Promise<void> {
  await authenticatedFetch<void>(`/admin/users/${userId}`, {
    method: 'DELETE',
  })
}

// Analytics
export async function getAnalytics(
  startDate?: string,
  endDate?: string,
): Promise<AnalyticsResponse> {
  let endpoint = '/admin/analytics'
  const params = new URLSearchParams()

  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  if (params.toString()) {
    endpoint += `?${params.toString()}`
  }

  return authenticatedFetch<AnalyticsResponse>(endpoint)
}

export async function getTriggerAnalytics(
  period: 'day' | 'week' | 'month' = 'month',
): Promise<TriggerStat[] | TriggerAnalytics[]> {
  return authenticatedFetch<TriggerStat[] | TriggerAnalytics[]>(
    `/admin/analytics/triggers?period=${period}`,
  )
}

export async function getSymptomCorrelation(): Promise<SymptomCorrelationStat[]> {
  return authenticatedFetch<SymptomCorrelationStat[]>('/admin/analytics/symptoms')
}

export async function getRecurringPatterns(): Promise<RecurringPatternStat[]> {
  return authenticatedFetch<RecurringPatternStat[]>('/admin/analytics/patterns')
}

export async function getPredictionHistory(
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<PredictionRecord>> {
  return authenticatedFetch<PaginatedResponse<PredictionRecord>>(
    `/admin/analytics/predictions?page=${page}&limit=${limit}`,
  )
}

// Reports
export async function generateReport(
  type: 'users' | 'crisis' | 'analytics',
  format: 'json' | 'pdf' = 'json',
): Promise<AdminReport> {
  return authenticatedFetch<AdminReport>('/admin/reports', {
    method: 'POST',
    body: JSON.stringify({ type, format }),
  })
}

export async function getReports(
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<AdminReport>> {
  return authenticatedFetch<PaginatedResponse<AdminReport>>(
    `/admin/reports?page=${page}&limit=${limit}`,
  )
}

export async function downloadReport(reportId: string): Promise<Blob> {
  const token = localStorage.getItem('accessToken')

  const response = await fetch(`${API_URL}/admin/reports/${reportId}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to download report')
  }

  return response.blob()
}

// Settings
export async function getAISettings(): Promise<AISettings> {
  return authenticatedFetch<AISettings>('/admin/settings/ai')
}

export async function updateAISettings(settings: Partial<AISettings>): Promise<AISettings> {
  return authenticatedFetch<AISettings>('/admin/settings/ai', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return authenticatedFetch<NotificationSettings>('/admin/settings/notifications')
}

export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  return authenticatedFetch<NotificationSettings>('/admin/settings/notifications', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

export async function getRiskLimits(): Promise<RiskLimits> {
  return authenticatedFetch<RiskLimits>('/admin/settings/risk')
}

export async function updateRiskLimits(limits: Partial<RiskLimits>): Promise<RiskLimits> {
  return authenticatedFetch<RiskLimits>('/admin/settings/risk', {
    method: 'PUT',
    body: JSON.stringify(limits),
  })
}
