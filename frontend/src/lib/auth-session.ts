import { getAccessToken, setAccessToken } from '@/lib/token-store'
import type { UserProfile } from '@/services/user.service'
import type { AuthSession, AuthUser } from '@/store/app-store'
import type { ApiUserRole } from '@/lib/user-role'

// F-14: the access token lives only in memory (see token-store.ts) and the
// refresh token lives only in an httpOnly cookie set by the backend — it
// never reaches this module, or any other frontend code, at all. Function
// names are kept stable to minimize call-site churn across the app.

export function getStoredAccessToken(): string | null {
  return getAccessToken()
}

export function hasStoredAuthTokens(): boolean {
  return Boolean(getStoredAccessToken())
}

export function storeAuthTokens(tokens: { accessToken: string }): void {
  setAccessToken(tokens.accessToken)
}

export function clearStoredAuthTokens(): void {
  setAccessToken(null)
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
    role: user.role as ApiUserRole,
    accountStatus: user.accountStatus ?? 'ACTIVE',
    specialty: user.specialty ?? null,
    professionalCouncilType: user.professionalCouncilType ?? null,
    professionalCouncilNumber: user.professionalCouncilNumber ?? null,
    professionalCouncilState: user.professionalCouncilState ?? null,
    professionalPhone: user.professionalPhone ?? null,
    professionalClinic: user.professionalClinic ?? null,
    professionalBio: user.professionalBio ?? null,
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
