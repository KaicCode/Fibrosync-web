import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const PERIOD_OPTIONS = [7, 30, 90] as const;
const FILTER_OPTIONS = ['all', 'recent', 'stale', 'incomplete'] as const;

export class DoctorPatientsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 12 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: FILTER_OPTIONS, default: 'all' })
  @IsOptional()
  @IsIn(FILTER_OPTIONS)
  filter?: 'all' | 'recent' | 'stale' | 'incomplete';

  @ApiPropertyOptional({ enum: PERIOD_OPTIONS, default: 30 })
  @Type(() => Number)
  @IsOptional()
  @IsIn(PERIOD_OPTIONS)
  periodDays?: 7 | 30 | 90;
}
