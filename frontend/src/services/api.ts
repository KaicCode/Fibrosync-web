import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { getStoredAccessToken, storeAuthTokens } from '@/lib/auth-session'
import {
  clearExpiredSession,
  createOfflineError,
  isBrowserOffline,
  normalizeHttpError,
  shouldAttemptTokenRefresh,
} from '@/lib/auth-http'
import { ApiError } from '@/lib/http-errors'
import { resolveApiUrl } from '@/lib/resolve-api-url'
import { performTokenRefresh } from '@/lib/session-refresh'

const API_URL = resolveApiUrl()
const API_REQUEST_TIMEOUT_MS = 30000

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: ApiError) => void
}> = []

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

function processQueue(error: ApiError | null, token: string | null = null): void {
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
  // F-14: required so the browser sends/receives the httpOnly refresh-token
  // cookie on requests to the API's origin — a different origin from the
  // frontend's (api.fibrosync.com vs. fibrosync.com in production), even
  // though both are same-site (same registrable domain), so this is still
  // a cross-origin request from the browser's point of view.
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    if (isBrowserOffline()) {
      return Promise.reject(createOfflineError())
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
    const originalRequest = error.config as RetriableRequestConfig | undefined

    if (
      shouldAttemptTokenRefresh({
        statusCode: error.response?.status,
        url: originalRequest?.url,
        hasRetried: originalRequest?._retry,
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
            return api(originalRequest)
        })
          .catch((refreshError) => Promise.reject(refreshError))
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
        // F-14: the refresh token is never read here — it lives only in
        // the httpOnly cookie, which the browser attaches automatically.
        const { accessToken } = await performTokenRefresh()

        storeAuthTokens({ accessToken })

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        processQueue(null, accessToken)

        return api(originalRequest)
      } catch (refreshError) {
        const normalizedError = normalizeHttpError(refreshError)
        processQueue(normalizedError, null)
        clearExpiredSession(normalizedError.code === 'SESSION_EXPIRED')
        return Promise.reject(normalizedError)
      }
    }

    if (
      error.response?.status === 401 &&
      originalRequest?._retry &&
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
