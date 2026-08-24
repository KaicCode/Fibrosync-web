import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

const PERIOD_OPTIONS = [7, 30, 90] as const;

export class DoctorDashboardQueryDto {
  @ApiPropertyOptional({ enum: PERIOD_OPTIONS, default: 30 })
  @Type(() => Number)
  @IsOptional()
  @IsIn(PERIOD_OPTIONS)
  periodDays?: 7 | 30 | 90;
}
