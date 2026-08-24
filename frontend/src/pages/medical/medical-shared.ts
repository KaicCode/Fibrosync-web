import {
  backBodyAreas,
  frontBodyAreas,
} from '@/features/clinical/clinical-model'
import type { DoctorPeriodDays, ReportPeriod } from '@/services/doctor.service'

const bodyAreaLabelById = new Map(
  [...frontBodyAreas, ...backBodyAreas].map((area) => [area.id, area.label]),
)

export function formatMedicalNumber(
  value: number | null | undefined,
  digits = 1,
): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--'
  }

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatMedicalDate(value?: string | null): string {
  if (!value) {
    return 'Sem data registrada'
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatMedicalDateTime(value?: string | null): string {
  if (!value) {
    return 'Sem atualizacao'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('pt-BR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function resolveBodyAreaLabel(areaId: string): string {
  return bodyAreaLabelById.get(areaId) ?? areaId
}

export function mapDaysToReportPeriod(periodDays: DoctorPeriodDays): ReportPeriod {
  if (periodDays === 7) {
    return 'weekly'
  }

  if (periodDays === 90) {
    return 'quarterly'
  }

  return 'monthly'
}

export function resolvePeriodWindow(periodDays: DoctorPeriodDays): {
  dateFrom: string
  dateTo: string
} {
  const end = new Date()
  end.setHours(0, 0, 0, 0)

  const start = new Date(end)
  start.setDate(end.getDate() - (periodDays - 1))

  const format = (value: Date) =>
    new Date(
      Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
    )
      .toISOString()
      .slice(0, 10)

  return {
    dateFrom: format(start),
    dateTo: format(end),
  }
}

export function resolveFollowUpTone(
  status: 'recent' | 'stale' | 'incomplete',
): 'success' | 'warning' | 'default' {
  if (status === 'recent') {
    return 'success'
  }

  if (status === 'stale') {
    return 'warning'
  }

  return 'default'
}
