import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class AdminAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Initial date in YYYY-MM-DD format.',
    example: '2026-08-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Final date in YYYY-MM-DD format.',
    example: '2026-08-23',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
