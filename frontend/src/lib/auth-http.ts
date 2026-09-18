import axios from 'axios'
import { clearStoredAuthTokens } from '@/lib/auth-session'
import { useAppStore } from '@/store/app-store'
import {
  ApiError,
  buildAccountUnavailableMessage,
  buildConnectivityErrorMessage,
  buildServerUnavailableMessage,
  buildSessionExpiredMessage,
  buildTimeoutErrorMessage,
  buildTooManyAttemptsMessage,
  resolveApiErrorCode,
} from '@/lib/http-errors'

const REFRESH_EXCLUDED_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
] as const

export function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

export function isRefreshExcludedRequest(url?: string): boolean {
  if (!url) {
    return false
  }

  return REFRESH_EXCLUDED_ROUTES.some((route) => url.includes(route))
}

// F-14: the refresh token lives in an httpOnly cookie, invisible to
// JavaScript, so this can no longer check "do we have a refresh token"
// client-side — the backend is the only source of truth for that. Any
// qualifying 401 is worth one refresh attempt; if there is no valid
// session cookie, performTokenRefresh() simply fails fast and
// clearExpiredSession() runs from the caller's catch block.
export function shouldAttemptTokenRefresh(input: {
  statusCode?: number
  url?: string
  hasRetried?: boolean
}): boolean {
  return Boolean(
    input.statusCode === 401 &&
      !input.hasRetried &&
      !isRefreshExcludedRequest(input.url),
  )
}

export function clearExpiredSession(redirectToLogin = true): void {
  clearStoredAuthTokens()
  useAppStore.getState().clearAuthSession()

  if (
    redirectToLogin &&
    typeof window !== 'undefined' &&
    window.location.pathname !== '/login'
  ) {
    window.location.assign('/login')
  }
}

export function normalizeHttpError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (!axios.isAxiosError(error)) {
    return new ApiError(
      error instanceof Error
        ? error.message
        : 'Nao foi possivel concluir a solicitacao.',
    )
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiError(buildTimeoutErrorMessage(), {
      code: 'TIMEOUT',
      statusCode: 408,
    })
  }

  if (error.code === 'ERR_NETWORK' || (error.request && !error.response)) {
    return new ApiError(buildConnectivityErrorMessage(), {
      code: 'NETWORK_ERROR',
    })
  }

  const statusCode = error.response?.status
  const payload = error.response?.data as
    | {
        error?: string
        message?: string
        details?: unknown
      }
    | undefined
  const details = payload?.details
  const resolvedCode = resolveApiErrorCode(statusCode, details)
  const responseMessage =
    payload?.error || payload?.message || error.message || 'Request failed.'

  if (resolvedCode === 'TOO_MANY_ATTEMPTS') {
    return new ApiError(buildTooManyAttemptsMessage(), {
      code: resolvedCode,
      statusCode,
      details,
    })
  }

  if (resolvedCode === 'SERVER_UNAVAILABLE') {
    return new ApiError(buildServerUnavailableMessage(), {
      code: resolvedCode,
      statusCode,
      details,
    })
  }

  if (resolvedCode === 'ACCOUNT_UNAVAILABLE') {
    return new ApiError(buildAccountUnavailableMessage(), {
      code: resolvedCode,
      statusCode,
      details,
    })
  }

  if (resolvedCode === 'SESSION_EXPIRED') {
    return new ApiError(buildSessionExpiredMessage(), {
      code: resolvedCode,
      statusCode,
      details,
    })
  }

  return new ApiError(responseMessage, {
    code: resolvedCode,
    statusCode,
    details,
  })
}

export function createOfflineError(): ApiError {
  return new ApiError(buildConnectivityErrorMessage(), {
    code: 'NETWORK_ERROR',
  })
}
