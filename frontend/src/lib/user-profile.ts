import type { UserProfile } from '@/services/user.service'
import type { AuthUser } from '@/store/app-store'

type BasicUser = {
  email?: string | null
  fullName?: string | null
  name?: string | null
  birthDate?: string | null
  gender?: string | null
  heightCm?: number | null
  weightKg?: number | null
  countryCode?: string | null
  timezone?: string | null
  role?: string | null
  onboardingCompleted?: boolean | null
  createdAt?: string | null
  lastLoginAt?: string | null
} & Partial<Pick<UserProfile, 'updatedAt'>> &
  Partial<Pick<AuthUser, 'updatedAt'>>

const countryLabels: Record<string, string> = {
  AR: 'Argentina',
  BR: 'Brasil',
  CL: 'Chile',
  PT: 'Portugal',
  US: 'Estados Unidos',
}

export function resolveUserDisplayName(user?: BasicUser | null): string {
  const fullName = user?.fullName?.trim()

  if (fullName) {
    return fullName
  }

  const name = user?.name?.trim()

  if (name) {
    return name
  }

  return 'Paciente'
}

export function resolveUserInitials(user?: BasicUser | null): string {
  const name = resolveUserDisplayName(user)
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) {
    return 'PA'
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
}

export function resolveUserAvatar(user?: BasicUser | null): string {
  const seed = user?.email?.trim() || resolveUserDisplayName(user)
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`
}

export function resolveCountryLabel(countryCode?: string | null): string {
  if (!countryCode) {
    return 'Nao informado'
  }

  return countryLabels[countryCode] ?? countryCode.toUpperCase()
}

export function formatDateValue(value?: string | null): string {
  if (!value) {
    return 'Nao informado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTimeValue(value?: string | null): string {
  if (!value) {
    return 'Nao informado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatHeightValue(value?: number | null): string {
  if (value === null || value === undefined) {
    return 'Nao informado'
  }

  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} cm`
}

export function formatWeightValue(value?: number | null): string {
  if (value === null || value === undefined) {
    return 'Nao informado'
  }

  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} kg`
}

export function calculateProfileCompletion(user?: BasicUser | null): number {
  if (!user) {
    return 0
  }

  const fields = [
    user.fullName ?? user.name,
    user.birthDate,
    user.gender,
    user.heightCm,
    user.weightKg,
    user.countryCode,
    user.timezone,
  ]

  const completed = fields.filter((field) => field !== null && field !== undefined && field !== '').length
  return Math.round((completed / fields.length) * 100)
}
