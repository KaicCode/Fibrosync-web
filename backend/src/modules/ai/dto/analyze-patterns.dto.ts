import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AnalyzePatternsDto {
  @ApiPropertyOptional({
    description: 'Optional analysis window override in days.',
    minimum: 14,
    maximum: 90,
    default: 30,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(14)
  @Max(90)
  lookbackDays?: number;
}
