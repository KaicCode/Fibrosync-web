import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class UpdateUserSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dailySummaryEnabled?: boolean;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  dailySummaryTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  endOfDayReminderEnabled?: boolean;

  @ApiPropertyOptional({ example: '20:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  endOfDayReminderTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smartSearchEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  calendarInsightsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inAppNotificationsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  quietHoursStart?: string | null;

  @ApiPropertyOptional({ example: '06:30' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN)
  quietHoursEnd?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  clinicalDataSharingEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reportExportConfirmationEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  deviceProtectionEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  permissionReviewEnabled?: boolean;
}
