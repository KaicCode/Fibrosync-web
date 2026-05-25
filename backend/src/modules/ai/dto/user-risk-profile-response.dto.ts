import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PersonalizedWeightDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  defaultWeight!: number;

  @ApiProperty()
  personalizedWeight!: number;

  @ApiProperty()
  overallOccurrenceRate!: number;

  @ApiProperty()
  precursorOccurrenceRate!: number;

  @ApiProperty()
  evidenceCount!: number;

  @ApiProperty()
  lift!: number;

  @ApiProperty()
  activeOnLatestDay!: boolean;
}

class TriggerPatternDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [String] })
  matchedFeatureKeys!: string[];

  @ApiProperty()
  occurrenceRateBeforeCrisis!: number;

  @ApiProperty()
  evidenceCount!: number;

  @ApiProperty({ enum: ['MEDIUM', 'HIGH'] })
  strength!: 'MEDIUM' | 'HIGH';
}

export class UserRiskProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  analysisWindowDays!: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  currentPersonalizedScore!: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  baselineScore!: number;

  @ApiProperty()
  lastCrisisSignalCount!: number;

  @ApiPropertyOptional()
  summary!: string | null;

  @ApiProperty({ type: [TriggerPatternDto] })
  triggerPatterns!: TriggerPatternDto[];

  @ApiProperty({ type: [PersonalizedWeightDto] })
  personalizedWeights!: PersonalizedWeightDto[];

  @ApiProperty({ format: 'date' })
  sourceWindowStart!: string;

  @ApiProperty({ format: 'date' })
  sourceWindowEnd!: string;

  @ApiProperty({ format: 'date-time' })
  lastAnalyzedAt!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
