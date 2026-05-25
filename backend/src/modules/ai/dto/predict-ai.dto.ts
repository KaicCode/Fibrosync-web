import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PredictAiDto {
  @ApiPropertyOptional({
    description:
      'Optional lookback window override, in days, used to assemble the behavioral context.',
    minimum: 7,
    maximum: 90,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(90)
  lookbackDays?: number;
}
