import axios from 'axios'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios'
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAuthTokens,
} from '@/lib/auth-session'
import {
  clearExpiredSession,
  createOfflineError,
  hasRefreshSession,
  isBrowserOffline,
  normalizeHttpError,
  shouldAttemptTokenRefresh,
} from '@/lib/auth-http'
import { ApiError } from '@/lib/http-errors'
import { resolveApiUrl } from '@/lib/resolve-api-url'

const API_URL = resolveApiUrl()
const API_REQUEST_TIMEOUT_MS = 30000
const REFRESH_REQUEST_TIMEOUT_MS = 30000

// Criar instância do Axios
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag para evitar requisições infinitas de refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: ApiError) => void
}> = []

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const processQueue = (error: ApiError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })

  isRefreshing = false
  failedQueue = []
}

// Request interceptor - adiciona token na requisição
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (isBrowserOffline()) {
      return Promise.reject(createOfflineError())
    }

    const token = getStoredAccessToken()

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor - trata erros e refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined

    if (
      shouldAttemptTokenRefresh({
        statusCode: error.response?.status,
        url: originalRequest?.url,
        hasRetried: originalRequest?._retry,
        hasAccessToken: Boolean(getStoredAccessToken()),
        hasRefreshToken: Boolean(getStoredRefreshToken()),
      })
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (!originalRequest) {
              return Promise.reject(
                new ApiError('Sua sessao expirou. Entre novamente.', {
                  code: 'SESSION_EXPIRED',
                  statusCode: 401,
                }),
              )
            }

            originalRequest.headers = originalRequest.headers ?? {}
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      if (!originalRequest) {
        return Promise.reject(
          new ApiError('Sua sessao expirou. Entre novamente.', {
            code: 'SESSION_EXPIRED',
            statusCode: 401,
          }),
        )
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = getStoredRefreshToken()

        if (!refreshToken) {
          throw new ApiError('Sua sessao expirou. Entre novamente.', {
            code: 'SESSION_EXPIRED',
            statusCode: 401,
          })
        }

        const response = await axios.post<
          ApiResponse<{
            accessToken: string
            refreshToken: string
          }>
        >(
          `${API_URL}/auth/refresh`,
          undefined,
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
            timeout: REFRESH_REQUEST_TIMEOUT_MS,
          },
        )

        const { accessToken, refreshToken: nextRefreshToken } = response.data.data

        storeAuthTokens({
          accessToken,
          refreshToken: nextRefreshToken,
        })

        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`

        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        processQueue(null, accessToken)

        return apiClient(originalRequest)
      } catch (err) {
        const normalizedError = normalizeHttpError(err)
        processQueue(normalizedError, null)
        clearExpiredSession(normalizedError.code === 'SESSION_EXPIRED')
        return Promise.reject(normalizedError)
      }
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !hasRefreshSession() &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/signup')
    ) {
      const sessionExpiredError = new ApiError('Sua sessao expirou. Entre novamente.', {
        code: 'SESSION_EXPIRED',
        statusCode: 401,
      })

      clearExpiredSession()
      return Promise.reject(sessionExpiredError)
    }

    return Promise.reject(normalizeHttpError(error))
  },
)

// Tipo para respostas da API
export type ApiResponse<T> = {
  success: boolean
  data: T
  error?: string
  message?: string
  details?: unknown
  timestamp?: string
  path?: string
}

// Helper para requisições
export const apiCall = async <T,>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  endpoint: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
  if (isBrowserOffline()) {
    throw createOfflineError()
  }

  try {
    const requestConfig: AxiosRequestConfig = {
      method,
      url: endpoint,
      ...config,
    }

    if (data !== undefined) {
      requestConfig.data = data
    }

    const response = await apiClient.request<ApiResponse<T>>(requestConfig)

    if (!response.data.success) {
      throw new ApiError(
        response.data.error || response.data.message || 'API Error',
      )
    }

    return response.data.data
  } catch (error) {
    throw normalizeHttpError(error)
  }
}
