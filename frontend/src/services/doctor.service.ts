import { apiCall } from '@/lib/api-client'
import type { DailyRecord } from '@/services/daily-record.service'

export type DoctorTimelinePoint = {
  date: string
  label: string
  tooltipLabel: string
  value: number | null
}

export type DoctorPatientListItem = {
  patientId: string
  fullName: string
  age: number | null
  countryCode: string | null
  lastRecordAt: string | null
  recentRecordCount: number
  latestPainLevel: number | null
  followUpStatus: 'recent' | 'stale' | 'incomplete'
  followUpLabel: string
  accessStatus: 'PENDING' | 'ACTIVE' | 'REVOKED'
}

export type DoctorDashboardResponse = {
  summary: {
    periodDays: number
    patientsTracked: number
    recentRecords: number
    patientsWithRecentActivity: number
    pendingFollowUps: number
  }
  patients: DoctorPatientListItem[]
  painSeries: DoctorTimelinePoint[]
  topSymptoms: Array<{
    label: string
    recordsCount: number
    percentage: number
  }>
  recentActivities: Array<{
    id: string
    type: 'record' | 'report' | 'access'
    patientId: string
    patientName: string
    title: string
    description: string
    occurredAt: string
  }>
}

export type DoctorPatientListResponse = {
  items: DoctorPatientListItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export type DoctorPatientDetailResponse = {
  patient: {
    id: string
    fullName: string
    age: number | null
    countryCode: string | null
    lastRecordAt: string | null
    lastPainLevel: number | null
    accessStatus: 'PENDING' | 'ACTIVE' | 'REVOKED'
    authorizedAt: string | null
    authorizationSource: string | null
    sharingEnabled: boolean
    accountStatus: 'PENDING_PROFILE' | 'ACTIVE' | 'SUSPENDED'
    onboardingCompleted: boolean
  }
  window: {
    periodDays: number
    start: string
    end: string
  }
  summary: {
    averagePainLevel: number | null
    latestPainLevel: number | null
    latestRecordDate: string | null
    trackedDays: number
    expectedDays: number
    averageSleepHours: number | null
    averageFatigueLevel: number | null
    averageStressLevel: number | null
    averageMoodLevel: number | null
    averageStiffnessLevel: number | null
  }
  charts: {
    pain: DoctorTimelinePoint[]
    sleepHours: DoctorTimelinePoint[]
    sleepQuality: DoctorTimelinePoint[]
    fatigue: DoctorTimelinePoint[]
    stress: DoctorTimelinePoint[]
    mood: DoctorTimelinePoint[]
    stiffness: DoctorTimelinePoint[]
  }
  bodyMap: {
    frontSelectedAreas: string[]
    backSelectedAreas: string[]
    topAreas: Array<{
      areaId: string
      count: number
      side: 'front' | 'back'
    }>
  }
  triggers: Array<{
    label: string
    count: number
  }>
  symptoms: Array<{
    label: string
    count: number
    percentage: number
  }>
  weatherContext: {
    available: boolean
    averageTemperature: number | null
    averageHumidity: number | null
    averagePressure: number | null
    latestSnapshot: {
      temperature: number
      humidity: number
      apparentTemperature: number
      precipitation: number
      pressure: number
      windSpeed: number
      weatherCode: number
      source?: string
      fetchedAt?: string
    } | null
    daysWithWeather: number
    note: string
  }
  analysis: {
    rules: {
      available: boolean
      attentionScore: number | null
      attentionLevel: string | null
      recordedAt: string | null
      explanation: string
      recommendationSummary: string | null
    }
    ai: {
      available: boolean
      probabilityScore: number | null
      riskLevel: string | null
      explanation: string | null
      suggestedAction: string | null
      generatedAt: string | null
      disclaimer: string
    }
  }
}

export type DoctorNote = {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  patientId: string
  doctorId: string
  visibility?: 'PRIVATE_DOCTOR_ONLY'
}

export type DoctorNotesResponse = {
  items: DoctorNote[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  visibility: 'PRIVATE_DOCTOR_ONLY'
}

export type DoctorPeriodDays = 7 | 30 | 90
export type DoctorPatientFilter = 'all' | 'recent' | 'stale' | 'incomplete'
export type ReportPeriod = 'weekly' | 'monthly' | 'quarterly'

type DoctorPatientParams = Partial<{
  page: number
  limit: number
  search: string
  filter: DoctorPatientFilter
  periodDays: DoctorPeriodDays
}>

type DoctorNoteParams = Partial<{
  page: number
  limit: number
}>

type ReportListResponse<T> = {
  items: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export type DoctorReport = {
  id: string
  type: string
  status: string
  periodStart: string
  periodEnd: string
  generatedAt: string | null
  createdAt: string
  updatedAt: string
  fileUrl: string | null
  summary: Record<string, unknown> | null
}

export const doctorService = {
  getDashboard: async (periodDays: DoctorPeriodDays = 30) => {
    return apiCall<DoctorDashboardResponse>('get', '/doctor/dashboard', undefined, {
      params: {
        periodDays,
      },
    })
  },

  getPatients: async (params?: DoctorPatientParams) => {
    return apiCall<DoctorPatientListResponse>('get', '/doctor/patients', undefined, {
      params,
    })
  },

  getPatient: async (patientId: string, periodDays: DoctorPeriodDays = 30) => {
    return apiCall<DoctorPatientDetailResponse>(
      'get',
      `/doctor/patients/${patientId}`,
      undefined,
      {
        params: {
          periodDays,
        },
      },
    )
  },

  getPatientRecords: async (
    patientId: string,
    params?: Partial<{
      page: number
      limit: number
      dateFrom: string
      dateTo: string
      includeAll: boolean
    }>,
  ) => {
    return apiCall<ReportListResponse<DailyRecord>>(
      'get',
      `/doctor/patients/${patientId}/records`,
      undefined,
      {
        params,
      },
    )
  },

  getPatientReports: async (
    patientId: string,
    params?: Partial<{
      page: number
      limit: number
      period: ReportPeriod
      status: string
    }>,
  ) => {
    return apiCall<ReportListResponse<DoctorReport>>(
      'get',
      `/doctor/patients/${patientId}/reports`,
      undefined,
      {
        params,
      },
    )
  },

  generatePatientReport: async (patientId: string, period: ReportPeriod) => {
    return apiCall<DoctorReport>(
      'get',
      `/doctor/patients/${patientId}/reports/generate`,
      undefined,
      {
        params: {
          period,
        },
      },
    )
  },

  getPatientNotes: async (patientId: string, params?: DoctorNoteParams) => {
    return apiCall<DoctorNotesResponse>(
      'get',
      `/doctor/patients/${patientId}/notes`,
      undefined,
      {
        params,
      },
    )
  },

  createPatientNote: async (patientId: string, content: string) => {
    return apiCall<DoctorNote>('post', `/doctor/patients/${patientId}/notes`, {
      content,
    })
  },

  updateNote: async (noteId: string, content: string) => {
    return apiCall<DoctorNote>('patch', `/doctor/notes/${noteId}`, {
      content,
    })
  },

  deleteNote: async (noteId: string) => {
    return apiCall<{ message: string }>('delete', `/doctor/notes/${noteId}`)
  },
}
