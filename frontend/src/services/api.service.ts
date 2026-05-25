import { apiCall } from '@/lib/api-client'
import type { AuthUser, AuthSession } from '@/store/app-store'

export type LoginPayload = {
  email: string
  password: string
}

export type SignupPayload = {
  name: string
  email: string
  password: string
  birthDate?: string
  gender?: string
  height?: number
  weight?: number
  country?: string
}

export type AuthResponse = {
  user: AuthUser
  access_token: string
  refresh_token: string
}

// Login
export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    return apiCall<AuthResponse>('post', '/auth/login', payload)
  },

  async signup(payload: SignupPayload): Promise<AuthResponse> {
    return apiCall<AuthResponse>('post', '/auth/signup', payload)
  },

  async logout(): Promise<void> {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  async getProfile(): Promise<AuthUser> {
    return apiCall<AuthUser>('get', '/users/me')
  },

  async updateProfile(data: Partial<AuthUser>): Promise<AuthUser> {
    return apiCall<AuthUser>('patch', '/users/me', data)
  },
}

// Daily Records
export type DailyRecord = {
  id: number
  userId: number
  date: string
  intensity: number
  painType: string
  symptoms: string[]
  triggers: string[]
  note?: string
  createdAt: string
  updatedAt: string
}

export type CreateDailyRecordPayload = Omit<
  DailyRecord,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>

export const dailyRecordsService = {
  async getRecords(filters?: {
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Promise<DailyRecord[]> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    return apiCall<DailyRecord[]>(
      'get',
      `/daily-records?${params.toString()}`,
    )
  },

  async getRecord(id: number): Promise<DailyRecord> {
    return apiCall<DailyRecord>('get', `/daily-records/${id}`)
  },

  async createRecord(data: CreateDailyRecordPayload): Promise<DailyRecord> {
    return apiCall<DailyRecord>('post', '/daily-records', data)
  },

  async updateRecord(id: number, data: Partial<CreateDailyRecordPayload>): Promise<DailyRecord> {
    return apiCall<DailyRecord>('patch', `/daily-records/${id}`, data)
  },

  async deleteRecord(id: number): Promise<void> {
    await apiCall<void>('delete', `/daily-records/${id}`)
  },
}

// Symptoms
export type Symptom = {
  id: number
  userId: number
  name: string
  severity: number
  frequency: number
  description?: string
  createdAt: string
  updatedAt: string
}

export type CreateSymptomPayload = Omit<Symptom, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

export const symptomsService = {
  async getSymptoms(): Promise<Symptom[]> {
    return apiCall<Symptom[]>('get', '/symptoms')
  },

  async createSymptom(data: CreateSymptomPayload): Promise<Symptom> {
    return apiCall<Symptom>('post', '/symptoms', data)
  },

  async updateSymptom(id: number, data: Partial<CreateSymptomPayload>): Promise<Symptom> {
    return apiCall<Symptom>('patch', `/symptoms/${id}`, data)
  },

  async deleteSymptom(id: number): Promise<void> {
    await apiCall<void>('delete', `/symptoms/${id}`)
  },
}

// AI Prediction
export type PredictionResult = {
  id: number
  userId: number
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  predictedTriggers: string[]
  explanation: string
  suggestedActions: string[]
  confidence: number
  createdAt: string
}

export type PredictionHistoryItem = PredictionResult & {
  actualOutcome?: boolean
}

export const predictionService = {
  async predict(recordData: any): Promise<PredictionResult> {
    return apiCall<PredictionResult>('post', '/ai/predict', recordData)
  },

  async getPredictionHistory(filters?: {
    limit?: number
    offset?: number
  }): Promise<PredictionHistoryItem[]> {
    const params = new URLSearchParams()
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    return apiCall<PredictionHistoryItem[]>(
      'get',
      `/prediction/history?${params.toString()}`,
    )
  },

  async getLatestPrediction(): Promise<PredictionResult | null> {
    try {
      return await apiCall<PredictionResult>('get', '/prediction/latest')
    } catch {
      return null
    }
  },
}

// Notifications
export type Notification = {
  id: number
  userId: number
  title: string
  message: string
  type: 'alert' | 'reminder' | 'update' | 'info'
  read: boolean
  data?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export const notificationsService = {
  async getNotifications(unreadOnly = false): Promise<Notification[]> {
    const endpoint = unreadOnly ? '/notifications?read=false' : '/notifications'
    return apiCall<Notification[]>('get', endpoint)
  },

  async markAsRead(id: number): Promise<Notification> {
    return apiCall<Notification>('patch', `/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await apiCall<void>('patch', '/notifications/read-all')
  },

  async deleteNotification(id: number): Promise<void> {
    await apiCall<void>('delete', `/notifications/${id}`)
  },
}

// Reports
export type Report = {
  id: number
  userId: number
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  data: {
    averageIntensity: number
    mostCommonTriggers: string[]
    symptomFrequency: Record<string, number>
    predictionAccuracy: number
    adherenceRate: number
    insights: string[]
  }
  generatedAt: string
}

export type ReportSummary = {
  lastWeek: Report | null
  lastMonth: Report | null
  insights: string[]
}

export const reportsService = {
  async generateReport(period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Promise<Report> {
    return apiCall<Report>('get', `/reports/generate?period=${period}`)
  },

  async getReportSummary(): Promise<ReportSummary> {
    return apiCall<ReportSummary>('get', '/reports/summary')
  },

  async getReports(filters?: {
    startDate?: string
    endDate?: string
  }): Promise<Report[]> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)

    return apiCall<Report[]>('get', `/reports?${params.toString()}`)
  },
}

// Analytics (Admin)
export type AnalyticsDashboard = {
  totalUsers: number
  activeUsers: number
  totalRecords: number
  averageCrisisRisk: number
  topTriggers: Array<{ name: string; count: number }>
  adherenceRate: number
  lastUpdated: string
}

export const analyticsService = {
  async getDashboard(): Promise<AnalyticsDashboard> {
    return apiCall<AnalyticsDashboard>('get', '/analytics/dashboard')
  },
}

// Admin Users
export type AdminUser = {
  id: number
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  lastLogin?: string
}

export const adminService = {
  async getUsers(filters?: { page?: number; limit?: number }): Promise<AdminUser[]> {
    const params = new URLSearchParams()
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    return apiCall<AdminUser[]>('get', `/admin/users?${params.toString()}`)
  },
}
