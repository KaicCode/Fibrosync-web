import { apiCall } from '@/lib/api-client'

export interface UserSettings {
  id: string
  dailySummaryEnabled: boolean
  dailySummaryTime: string
  endOfDayReminderEnabled: boolean
  endOfDayReminderTime: string
  smartSearchEnabled: boolean
  calendarInsightsEnabled: boolean
  inAppNotificationsEnabled: boolean
  emailNotificationsEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart?: string | null
  quietHoursEnd?: string | null
  clinicalDataSharingEnabled: boolean
  reportExportConfirmationEnabled: boolean
  deviceProtectionEnabled: boolean
  permissionReviewEnabled: boolean
  createdAt: string
  updatedAt: string
}

export type UpdateUserSettingsDto = Partial<{
  dailySummaryEnabled: boolean
  dailySummaryTime: string
  endOfDayReminderEnabled: boolean
  endOfDayReminderTime: string
  smartSearchEnabled: boolean
  calendarInsightsEnabled: boolean
  inAppNotificationsEnabled: boolean
  emailNotificationsEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  clinicalDataSharingEnabled: boolean
  reportExportConfirmationEnabled: boolean
  deviceProtectionEnabled: boolean
  permissionReviewEnabled: boolean
}>

export const userSettingsService = {
  getSettings: async (): Promise<UserSettings> => {
    return apiCall<UserSettings>('get', '/users/me/settings')
  },

  updateSettings: async (data: UpdateUserSettingsDto): Promise<UserSettings> => {
    return apiCall<UserSettings>('patch', '/users/me/settings', data)
  },
}
