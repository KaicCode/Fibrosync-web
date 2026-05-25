import { useState, useEffect } from 'react'
import type {
  AdminDashboardMetrics,
  AdminUser,
  CrisisAlert,
  PaginatedResponse,
  AnalyticsResponse,
} from '@/types/admin'
import * as adminService from '@/services/admin'

// Hook para métricas do dashboard
export function useAdminDashboardMetrics() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await adminService.getAdminDashboardMetrics()
        setMetrics(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch metrics'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  return { metrics, isLoading, error }
}

// Hook para alertas de crise
export function useCrisisAlerts(page = 1, limit = 10) {
  const [data, setData] = useState<PaginatedResponse<CrisisAlert> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await adminService.getCrisisAlerts(page, limit)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch crisis alerts'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchAlerts()
  }, [page, limit])

  return { data, isLoading, error }
}

// Hook para usuários
export function useAdminUsers(page = 1, limit = 10, search?: string) {
  const [data, setData] = useState<PaginatedResponse<AdminUser> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await adminService.getAdminUsers(page, limit, search)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch users'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [page, limit, search])

  return { data, isLoading, error }
}

// Hook para análiticos
export function useAnalytics(startDate?: string, endDate?: string) {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await adminService.getAnalytics(startDate, endDate)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch analytics'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [startDate, endDate])

  return { data, isLoading, error }
}
