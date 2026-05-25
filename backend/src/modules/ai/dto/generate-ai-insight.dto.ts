import { ApiPropertyOptional } from '@nestjs/swagger';
import { InsightType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class GenerateAiInsightDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  dailyRecordId?: string;

  @ApiPropertyOptional({ enum: InsightType })
  @IsOptional()
  @IsEnum(InsightType)
  type?: InsightType;
}
