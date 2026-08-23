import { api } from './api'
import type {
  AdminAnalyticsResponse,
  AdminCreateSymptomInput,
  AdminCreateUserInput,
  AdminDashboardPeriodOption,
  AdminDashboardSummary,
  AdminSystemSettingsSummary,
  AdminSymptomRecord,
  AdminSymptomsListResponse,
  AdminUpdateSymptomInput,
  ResetAdminSystemSettingsInput,
  AdminUpdateUserInput,
  AdminUser,
  AdminUsersListResponse,
  UpdateAdminSystemSettingsInput,
} from '@/types/admin'

type ListUsersParams = {
  page?: number
  limit?: number
  search?: string
  role?: 'USER' | 'MEDICAL' | 'ADMIN'
}

type ListSymptomsParams = {
  page?: number
  limit?: number
  search?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
}

type GetAdminAnalyticsParams = {
  startDate?: string
  endDate?: string
}

function toUser(input: AdminUser): AdminUser {
  return {
    ...input,
    name: input.fullName,
    lastLogin: input.lastLoginAt ?? null,
  }
}

export const adminService = {
  getDashboardOverview: async (
    periodDays: AdminDashboardPeriodOption = 30,
  ): Promise<AdminDashboardSummary> => {
    const response = await api.get<AdminDashboardSummary>('/admin/dashboard', {
      params: {
        periodDays,
      },
    })
    return response.data
  },

  getDashboardAnalytics: async (
    periodDays: AdminDashboardPeriodOption = 30,
  ): Promise<AdminDashboardSummary> => {
    return adminService.getDashboardOverview(periodDays)
  },

  getAnalytics: async (
    params?: GetAdminAnalyticsParams,
  ): Promise<AdminAnalyticsResponse> => {
    const response = await api.get<AdminAnalyticsResponse>('/admin/analytics', {
      params,
    })
    return response.data
  },

  getSystemSettings: async (): Promise<AdminSystemSettingsSummary> => {
    const response = await api.get<AdminSystemSettingsSummary>('/admin/settings')
    return response.data
  },

  updateSystemSettings: async (
    payload: UpdateAdminSystemSettingsInput,
  ): Promise<AdminSystemSettingsSummary> => {
    const response = await api.patch<AdminSystemSettingsSummary>(
      '/admin/settings',
      payload,
    )
    return response.data
  },

  resetSystemSettings: async (
    payload: ResetAdminSystemSettingsInput,
  ): Promise<AdminSystemSettingsSummary> => {
    const response = await api.post<AdminSystemSettingsSummary>(
      '/admin/settings/reset',
      payload,
    )
    return response.data
  },

  getUsers: async (params?: ListUsersParams): Promise<AdminUsersListResponse> => {
    const response = await api.get<AdminUsersListResponse>('/users', {
      params,
    })

    return {
      ...response.data,
      items: response.data.items.map(toUser),
    }
  },

  getUserById: async (userId: string): Promise<AdminUser> => {
    const response = await api.get<AdminUser>(`/users/${userId}`)
    return toUser(response.data)
  },

  createUser: async (payload: AdminCreateUserInput): Promise<AdminUser> => {
    const response = await api.post<AdminUser>('/users', payload)
    return toUser(response.data)
  },

  updateUser: async (
    userId: string,
    payload: AdminUpdateUserInput,
  ): Promise<AdminUser> => {
    const response = await api.patch<AdminUser>(`/users/${userId}`, payload)
    return toUser(response.data)
  },

  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/users/${userId}`)
    return response.data
  },

  getSymptoms: async (
    params?: ListSymptomsParams,
  ): Promise<AdminSymptomsListResponse> => {
    const response = await api.get<AdminSymptomsListResponse>('/symptoms/admin', {
      params,
    })
    return response.data
  },

  getSymptomById: async (symptomId: string): Promise<AdminSymptomRecord> => {
    const response = await api.get<AdminSymptomRecord>(`/symptoms/admin/${symptomId}`)
    return response.data
  },

  createSymptom: async (
    payload: AdminCreateSymptomInput,
  ): Promise<AdminSymptomRecord> => {
    const response = await api.post<AdminSymptomRecord>('/symptoms/admin', payload)
    return response.data
  },

  updateSymptom: async (
    symptomId: string,
    payload: AdminUpdateSymptomInput,
  ): Promise<AdminSymptomRecord> => {
    const response = await api.patch<AdminSymptomRecord>(
      `/symptoms/admin/${symptomId}`,
      payload,
    )
    return response.data
  },

  deleteSymptom: async (symptomId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `/symptoms/admin/${symptomId}`,
    )
    return response.data
  },
}
