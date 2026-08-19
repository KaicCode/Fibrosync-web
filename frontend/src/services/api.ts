import axios from 'axios'
import {
  clearStoredAuthTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAuthTokens,
} from '@/lib/auth-session'
import { resolveApiUrl } from '@/lib/resolve-api-url'
import { useAppStore } from '@/store/app-store'

const API_URL = resolveApiUrl()
const API_REQUEST_TIMEOUT_MS = 15000

function buildConnectivityErrorMessage(): string {
  return `Nao foi possivel conectar com a API. Verifique se VITE_API_URL aponta para ${API_URL} e se FRONTEND_URL no backend inclui a URL da Vercel.`
}

function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: Error) => void
}> = []

function processQueue(error: Error | null, token: string | null = null): void {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error)
      return
    }

    request.resolve(token!)
  })

  failedQueue = []
  isRefreshing = false
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: API_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    if (isBrowserOffline()) {
      return Promise.reject(new Error(buildConnectivityErrorMessage()))
    }

    const token = getStoredAccessToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data
    ) {
      if (response.data.success) {
        response.data = response.data.data
      } else {
        return Promise.reject(
          new Error(response.data.message || response.data.error || 'API Error'),
        )
      }
    }

    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers ?? {}
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((refreshError) => Promise.reject(refreshError))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = getStoredRefreshToken()

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, undefined, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
          timeout: API_REQUEST_TIMEOUT_MS,
        })

        const { accessToken, refreshToken: nextRefreshToken } = response.data.data

        storeAuthTokens({
          accessToken,
          refreshToken: nextRefreshToken,
        })

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        processQueue(null, accessToken)

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        clearStoredAuthTokens()
        useAppStore.getState().clearAuthSession()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)
