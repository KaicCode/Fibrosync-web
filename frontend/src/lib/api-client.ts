import axios from 'axios'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios'
import { resolveApiUrl } from '@/lib/resolve-api-url'
import { useAppStore } from '@/store/app-store'

const API_URL = resolveApiUrl()

// Criar instância do Axios
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag para evitar requisições infinitas de refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: Error) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null) => {
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
    // Compat: o app salva tokens em accessToken/refreshToken (login) e em
    // access_token/refresh_token (outros clients). Aqui aceitamos ambos.
    const token =
      localStorage.getItem('accessToken') ??
      localStorage.getItem('access_token')

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
    const originalRequest = error.config

    // Se é erro 401 e ainda não tentou refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Se já está fazendo refresh, aguardar na fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers ?? {}
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken =
          localStorage.getItem('refreshToken') ??
          localStorage.getItem('refresh_token')

        if (!refreshToken) {
          throw new Error('No refresh token available')
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
          },
        )

        const { accessToken, refreshToken: nextRefreshToken } = response.data.data

        // Salva em ambos os formatos para compatibilidade
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', nextRefreshToken)
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', nextRefreshToken)

        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`

        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        processQueue(null, accessToken)

        return apiClient(originalRequest)
      } catch (err) {
        processQueue(err as Error, null)

        // Limpar tokens e redirecionar para login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')

        useAppStore.getState().clearAuthSession()

        window.location.href = '/'

        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
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

export class ApiError extends Error {
  statusCode?: number
  details?: unknown

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }
}

// Helper para requisições
export const apiCall = async <T,>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  endpoint: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
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
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message

      throw new ApiError(
        message,
        error.response?.status,
        error.response?.data?.details,
      )
    }
    throw error
  }
}
