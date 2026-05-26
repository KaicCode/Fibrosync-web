import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAppStore } from '@/store/app-store'

const API_URL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000/api'

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
    const token = localStorage.getItem('access_token')
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
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Se já está fazendo refresh, aguardar na fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
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
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        })

        const { access_token, refresh_token } = response.data.data

        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)

        apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`
        originalRequest.headers.Authorization = `Bearer ${access_token}`

        processQueue(null, access_token)

        return apiClient(originalRequest)
      } catch (err) {
        processQueue(err as Error, null)

        // Limpar tokens e redirecionar para login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        useAppStore.getState().clearAuthSession()

        window.location.href = '/login'

        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  },
)

// Tipo para respostas da API
export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
  statusCode: number
}

// Helper para requisições
export const apiCall = async <T,>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  endpoint: string,
  data?: any,
  config?: any,
): Promise<T> => {
  try {
    const response = await apiClient[method]<ApiResponse<T>>(endpoint, data, config)

    if (!response.data.success) {
      throw new Error(response.data.message || 'API Error')
    }

    return response.data.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message
      throw new Error(message)
    }
    throw error
  }
}
