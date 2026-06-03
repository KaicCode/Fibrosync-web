import { api } from './api'
import type {
  AdminCreateSymptomInput,
  AdminCreateUserInput,
  AdminDashboardSummary,
  AdminSymptomRecord,
  AdminSymptomsListResponse,
  AdminUpdateSymptomInput,
  AdminUpdateUserInput,
  AdminUser,
  AdminUsersListResponse,
} from '@/types/admin'

type ListUsersParams = {
  page?: number
  limit?: number
  search?: string
  role?: 'USER' | 'ADMIN'
}

type ListSymptomsParams = {
  page?: number
  limit?: number
  search?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
}

function toUser(input: AdminUser): AdminUser {
  return {
    ...input,
    name: input.fullName,
    lastLogin: input.lastLoginAt ?? null,
    status: 'active',
  }
}

export const adminService = {
  getDashboardAnalytics: async (): Promise<AdminDashboardSummary> => {
    const response = await api.get<AdminDashboardSummary>('/analytics/dashboard')
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
