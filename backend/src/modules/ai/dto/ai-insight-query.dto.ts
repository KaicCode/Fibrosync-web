import { ApiPropertyOptional } from '@nestjs/swagger';
import { InsightStatus, InsightType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class AiInsightQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InsightType })
  @IsOptional()
  @IsEnum(InsightType)
  type?: InsightType;

  @ApiPropertyOptional({ enum: InsightStatus })
  @IsOptional()
  @IsEnum(InsightStatus)
  status?: InsightStatus;
}
