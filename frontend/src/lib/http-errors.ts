export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_UNAVAILABLE'
  | 'TOO_MANY_ATTEMPTS'
  | 'NETWORK_ERROR'
  | 'SERVER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN'

export class ApiError extends Error {
  code: AuthErrorCode
  statusCode?: number
  details?: unknown

  constructor(
    message: string,
    options?: {
      code?: AuthErrorCode
      statusCode?: number
      details?: unknown
    },
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = options?.code ?? 'UNKNOWN'
    this.statusCode = options?.statusCode
    this.details = options?.details
  }
}

function readCodeFromDetails(details: unknown): string | null {
  if (!details || typeof details !== 'object') {
    return null
  }

  const code = (details as { code?: unknown }).code
  return typeof code === 'string' ? code.toUpperCase() : null
}

export function buildConnectivityErrorMessage(): string {
  return 'Nao foi possivel conectar ao FibroSync. Verifique sua conexao e tente novamente.'
}

export function buildTimeoutErrorMessage(): string {
  return 'O acesso esta demorando mais do que o esperado. Tente novamente.'
}

export function buildTooManyAttemptsMessage(): string {
  return 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.'
}

export function buildServerUnavailableMessage(): string {
  return 'O FibroSync esta temporariamente indisponivel. Tente novamente em alguns instantes.'
}

export function buildSessionExpiredMessage(): string {
  return 'Sua sessao expirou. Entre novamente.'
}

export function buildAccountUnavailableMessage(): string {
  return 'Sua conta nao esta disponivel para acesso no momento.'
}

export function resolveApiErrorCode(
  statusCode?: number,
  details?: unknown,
): AuthErrorCode {
  const explicitCode = readCodeFromDetails(details)

  if (explicitCode === 'INVALID_CREDENTIALS') {
    return 'INVALID_CREDENTIALS'
  }

  if (explicitCode === 'ACCOUNT_UNAVAILABLE') {
    return 'ACCOUNT_UNAVAILABLE'
  }

  if (explicitCode === 'SESSION_EXPIRED') {
    return 'SESSION_EXPIRED'
  }

  if (statusCode === 401) {
    return 'SESSION_EXPIRED'
  }

  if (statusCode === 403) {
    return 'ACCOUNT_UNAVAILABLE'
  }

  if (statusCode === 429) {
    return 'TOO_MANY_ATTEMPTS'
  }

  if (typeof statusCode === 'number' && statusCode >= 500) {
    return 'SERVER_UNAVAILABLE'
  }

  return 'UNKNOWN'
}

export function normalizeLoginError(error: unknown): ApiError {
  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel fazer login agora. Tente novamente.',
        )

  if (apiError.code === 'NETWORK_ERROR') {
    return new ApiError(buildConnectivityErrorMessage(), {
      code: 'NETWORK_ERROR',
      statusCode: apiError.statusCode,
      details: apiError.details,
    })
  }

  if (apiError.code === 'TIMEOUT') {
    return new ApiError(buildTimeoutErrorMessage(), {
      code: 'TIMEOUT',
      statusCode: apiError.statusCode,
      details: apiError.details,
    })
  }

  const resolvedCode =
    apiError.code !== 'UNKNOWN'
      ? apiError.code
      : resolveApiErrorCode(apiError.statusCode, apiError.details)

  if (resolvedCode === 'INVALID_CREDENTIALS' || apiError.statusCode === 401) {
    return new ApiError('Email ou senha incorretos.', {
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
      details: apiError.details,
    })
  }

  if (resolvedCode === 'ACCOUNT_UNAVAILABLE') {
    return new ApiError(buildAccountUnavailableMessage(), {
      code: 'ACCOUNT_UNAVAILABLE',
      statusCode: apiError.statusCode ?? 403,
      details: apiError.details,
    })
  }

  if (resolvedCode === 'TOO_MANY_ATTEMPTS') {
    return new ApiError(buildTooManyAttemptsMessage(), {
      code: 'TOO_MANY_ATTEMPTS',
      statusCode: 429,
      details: apiError.details,
    })
  }

  if (resolvedCode === 'SERVER_UNAVAILABLE') {
    return new ApiError(buildServerUnavailableMessage(), {
      code: 'SERVER_UNAVAILABLE',
      statusCode: apiError.statusCode,
      details: apiError.details,
    })
  }

  return new ApiError(
    apiError.message || 'Nao foi possivel fazer login agora. Tente novamente.',
    {
      code: 'UNKNOWN',
      statusCode: apiError.statusCode,
      details: apiError.details,
    },
  )
}
