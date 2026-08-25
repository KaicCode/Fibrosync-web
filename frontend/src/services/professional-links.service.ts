import { apiCall } from '@/lib/api-client'

export type ProfessionalDoctorSummary = {
  id: string
  fullName: string
  specialty: string | null
  professionalCouncilType: string | null
  professionalCouncilNumber: string | null
  professionalCouncilState: string | null
  professionalClinic: string | null
}

export type PatientLinkCodeResponse = {
  code: string
  sharingEnabled: boolean
}

export type PatientProfessionalRequest = {
  id: string
  status: 'PENDING'
  requestedAt: string
  doctor: ProfessionalDoctorSummary
}

export type PatientProfessionalRequestListResponse = {
  items: PatientProfessionalRequest[]
}

export type AuthorizedProfessionalItem = {
  id: string
  authorizedAt: string | null
  doctor: ProfessionalDoctorSummary
}

export type AuthorizedProfessionalListResponse = {
  sharingEnabled: boolean
  items: AuthorizedProfessionalItem[]
}

export type DoctorPatientLookupResponse = {
  patientId: string
  maskedName: string
  existingStatus: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REVOKED' | null
  canRequest: boolean
  note: string
}

export type DoctorPatientLinkRequestItem = {
  id: string
  status: 'PENDING' | 'REJECTED' | 'REVOKED'
  requestedAt: string | null
  respondedAt: string | null
  authorizedAt: string | null
  revokedAt: string | null
  updatedAt: string
  patient: {
    maskedName: string
  }
}

export type DoctorPatientLinkRequestListResponse = {
  items: DoctorPatientLinkRequestItem[]
}

export const professionalLinksService = {
  getMyLinkCode: async () => {
    return apiCall<PatientLinkCodeResponse>('get', '/patient/professionals/code')
  },

  regenerateMyLinkCode: async () => {
    return apiCall<PatientLinkCodeResponse & { message: string }>(
      'post',
      '/patient/professionals/code/regenerate',
    )
  },

  getMyRequests: async () => {
    return apiCall<PatientProfessionalRequestListResponse>(
      'get',
      '/patient/professionals/requests',
    )
  },

  acceptRequest: async (accessId: string) => {
    return apiCall<{ message: string }>(
      'post',
      `/patient/professionals/requests/${accessId}/accept`,
    )
  },

  rejectRequest: async (accessId: string) => {
    return apiCall<{ message: string }>(
      'post',
      `/patient/professionals/requests/${accessId}/reject`,
    )
  },

  getMyProfessionals: async () => {
    return apiCall<AuthorizedProfessionalListResponse>(
      'get',
      '/patient/professionals',
    )
  },

  revokeProfessional: async (accessId: string) => {
    return apiCall<{ message: string }>(
      'delete',
      `/patient/professionals/${accessId}`,
    )
  },

  lookupPatientByCode: async (code: string) => {
    return apiCall<DoctorPatientLookupResponse>(
      'post',
      '/doctor/patient-links/lookup',
      { code },
    )
  },

  requestPatientLink: async (code: string) => {
    return apiCall<{
      id: string
      status: 'PENDING'
      requestedAt: string | null
      message: string
    }>('post', '/doctor/patient-links/request', { code })
  },

  listDoctorRequests: async () => {
    return apiCall<DoctorPatientLinkRequestListResponse>(
      'get',
      '/doctor/patient-links',
    )
  },
}
