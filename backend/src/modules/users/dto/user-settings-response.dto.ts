import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserSettingsResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  dailySummaryEnabled!: boolean;

  @ApiProperty()
  dailySummaryTime!: string;

  @ApiProperty()
  endOfDayReminderEnabled!: boolean;

  @ApiProperty()
  endOfDayReminderTime!: string;

  @ApiProperty()
  smartSearchEnabled!: boolean;

  @ApiProperty()
  calendarInsightsEnabled!: boolean;

  @ApiProperty()
  inAppNotificationsEnabled!: boolean;

  @ApiProperty()
  emailNotificationsEnabled!: boolean;

  @ApiProperty()
  quietHoursEnabled!: boolean;

  @ApiPropertyOptional()
  quietHoursStart?: string | null;

  @ApiPropertyOptional()
  quietHoursEnd?: string | null;

  @ApiProperty()
  clinicalDataSharingEnabled!: boolean;

  @ApiProperty()
  reportExportConfirmationEnabled!: boolean;

  @ApiProperty()
  deviceProtectionEnabled!: boolean;

  @ApiProperty()
  permissionReviewEnabled!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
