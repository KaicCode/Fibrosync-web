import type { UserProfile } from '@/services/user.service'
import type { AuthSession, AuthUser } from '@/store/app-store'

const ACCESS_TOKEN_KEYS = ['accessToken', 'access_token'] as const
const REFRESH_TOKEN_KEYS = ['refreshToken', 'refresh_token'] as const

function readFirstAvailableKey(keys: readonly string[]): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  for (const key of keys) {
    const value = window.localStorage.getItem(key)

    if (value) {
      return value
    }
  }

  return null
}

function writeTokenKeys(
  keys: readonly string[],
  value: string | null | undefined,
): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!value) {
    for (const key of keys) {
      window.localStorage.removeItem(key)
    }
    return
  }

  for (const key of keys) {
    window.localStorage.setItem(key, value)
  }
}

export function getStoredAccessToken(): string | null {
  return readFirstAvailableKey(ACCESS_TOKEN_KEYS)
}

export function getStoredRefreshToken(): string | null {
  return readFirstAvailableKey(REFRESH_TOKEN_KEYS)
}

export function hasStoredAuthTokens(): boolean {
  return Boolean(getStoredAccessToken() || getStoredRefreshToken())
}

export function storeAuthTokens(tokens: {
  accessToken: string
  refreshToken?: string | null
}): void {
  writeTokenKeys(ACCESS_TOKEN_KEYS, tokens.accessToken)

  if (tokens.refreshToken !== undefined) {
    writeTokenKeys(REFRESH_TOKEN_KEYS, tokens.refreshToken)
  }
}

export function clearStoredAuthTokens(): void {
  writeTokenKeys(ACCESS_TOKEN_KEYS, null)
  writeTokenKeys(REFRESH_TOKEN_KEYS, null)
}

export function mapUserToSessionUser(user: UserProfile): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
    fullName: user.fullName,
    birthDate: user.birthDate ?? null,
    gender: user.gender ?? null,
    heightCm: user.heightCm ?? null,
    weightKg: user.weightKg ?? null,
    countryCode: user.countryCode ?? null,
    timezone: user.timezone,
    role: user.role as 'USER' | 'ADMIN',
    onboardingCompleted: user.onboardingCompleted,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export function buildAuthSession(
  accessToken: string,
  user: UserProfile,
): AuthSession {
  return {
    token: accessToken,
    user: mapUserToSessionUser(user),
  }
}
