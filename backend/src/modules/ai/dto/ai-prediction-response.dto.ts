import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiPredictionRiskLevel } from '@prisma/client';

export class AiPredictionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  dailyRecordId?: string | null;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  model!: string;

  @ApiProperty()
  promptVersion!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  probabilityScore!: number;

  @ApiProperty({ enum: AiPredictionRiskLevel })
  riskLevel!: AiPredictionRiskLevel;

  @ApiProperty()
  explanation!: string;

  @ApiProperty()
  suggestedAction!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
