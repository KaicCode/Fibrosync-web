import type { Prisma } from '@prisma/client';

export const userSettingsSelect = {
  id: true,
  dailySummaryEnabled: true,
  dailySummaryTime: true,
  endOfDayReminderEnabled: true,
  endOfDayReminderTime: true,
  smartSearchEnabled: true,
  calendarInsightsEnabled: true,
  inAppNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  quietHoursEnabled: true,
  quietHoursStart: true,
  quietHoursEnd: true,
  clinicalDataSharingEnabled: true,
  reportExportConfirmationEnabled: true,
  deviceProtectionEnabled: true,
  permissionReviewEnabled: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSettingsSelect;

export type UserSettingsDetails = Prisma.UserSettingsGetPayload<{
  select: typeof userSettingsSelect;
}>;
