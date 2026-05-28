import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';
import { ReportPeriod } from '../enums/report-period.enum';

class ReportWindowDto {
  @ApiProperty({ format: 'date' })
  start!: string;

  @ApiProperty({ format: 'date' })
  end!: string;

  @ApiProperty()
  expectedDays!: number;

  @ApiProperty()
  capturedDays!: number;
}

class ReportPdfExportDto {
  @ApiProperty()
  readyForFutureGeneration!: boolean;

  @ApiProperty()
  generated!: boolean;

  @ApiPropertyOptional({ nullable: true })
  fileUrl!: string | null;
}

class ReportMetadataDto {
  @ApiProperty()
  format!: string;

  @ApiProperty({ enum: ReportPeriod })
  period!: ReportPeriod;

  @ApiProperty({ format: 'date-time' })
  generatedAt!: Date;

  @ApiProperty({ type: ReportWindowDto })
  window!: ReportWindowDto;

  @ApiProperty({ type: ReportPdfExportDto })
  pdfExport!: ReportPdfExportDto;
}

class ReportOverviewDto {
  @ApiProperty()
  recordedEntries!: number;

  @ApiProperty()
  recordedDays!: number;

  @ApiProperty()
  averagePainLevel!: number;

  @ApiProperty()
  symptomSignalCount!: number;

  @ApiProperty()
  rulePredictionCount!: number;

  @ApiProperty()
  aiPredictionCount!: number;

  @ApiProperty()
  dataCoverageRate!: number;

  @ApiProperty()
  averageSleepHours!: number;

  @ApiProperty()
  averageFatigueLevel!: number;

  @ApiProperty()
  averageMoodLevel!: number;

  @ApiProperty()
  averageStressLevel!: number;

  @ApiProperty()
  averageProbabilityScore!: number;

  @ApiProperty()
  averageDataReliabilityScore!: number;

  @ApiProperty()
  dataReliabilityLabel!: string;

  @ApiProperty()
  derivedRecordRate!: number;
}

class ReportMetricPointDto {
  @ApiProperty({ format: 'date-time' })
  date!: string;

  @ApiProperty()
  value!: number;
}

class ReportMetricEvolutionDto {
  @ApiProperty()
  average!: number;

  @ApiProperty({ nullable: true })
  min!: number | null;

  @ApiProperty({ nullable: true })
  max!: number | null;

  @ApiProperty({ nullable: true })
  latest!: number | null;

  @ApiProperty()
  change!: number;

  @ApiProperty({
    enum: ['improving', 'stable', 'worsening'],
  })
  trend!: 'improving' | 'stable' | 'worsening';

  @ApiProperty({ type: [ReportMetricPointDto] })
  series!: ReportMetricPointDto[];
}

class ReportSleepEvolutionDto {
  @ApiProperty({ type: ReportMetricEvolutionDto })
  hours!: ReportMetricEvolutionDto;

  @ApiProperty({ type: ReportMetricEvolutionDto })
  quality!: ReportMetricEvolutionDto;
}

class ReportPainPatternItemDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  occurrences!: number;

  @ApiProperty()
  percentage!: number;
}

class ReportPainPatternsDto {
  @ApiProperty({ type: [ReportPainPatternItemDto] })
  types!: ReportPainPatternItemDto[];

  @ApiProperty({ type: [ReportPainPatternItemDto] })
  areas!: ReportPainPatternItemDto[];

  @ApiProperty({ type: [ReportPainPatternItemDto] })
  triggers!: ReportPainPatternItemDto[];
}

class ReportRecurringTriggerDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  source!: string;

  @ApiProperty()
  occurrences!: number;

  @ApiProperty()
  occurrenceRate!: number;

  @ApiProperty()
  highRiskOccurrences!: number;

  @ApiProperty()
  highRiskRate!: number;

  @ApiProperty()
  evidence!: string;
}

class ReportProbabilityPointDto {
  @ApiProperty({ format: 'date' })
  date!: string;

  @ApiProperty({ nullable: true })
  ruleBasedProbabilityScore!: number | null;

  @ApiProperty({ nullable: true })
  aiProbabilityScore!: number | null;

  @ApiProperty({ nullable: true })
  combinedProbabilityScore!: number | null;

  @ApiPropertyOptional({ nullable: true })
  highestSource!: string | null;
}

class ReportCrisisProbabilityDto {
  @ApiProperty()
  averageProbabilityScore!: number;

  @ApiProperty()
  maxProbabilityScore!: number;

  @ApiProperty()
  highRiskDays!: number;

  @ApiProperty()
  urgentRiskDays!: number;

  @ApiProperty({ nullable: true })
  latestProbabilityScore!: number | null;

  @ApiPropertyOptional({ nullable: true })
  latestRiskSource!: string | null;

  @ApiProperty({ type: [ReportProbabilityPointDto] })
  dailySeries!: ReportProbabilityPointDto[];
}

class ReportCorrelationDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  leftMetric!: string;

  @ApiProperty()
  rightMetric!: string;

  @ApiProperty()
  coefficient!: number;

  @ApiProperty({
    enum: ['positive', 'negative', 'none'],
  })
  direction!: 'positive' | 'negative' | 'none';

  @ApiProperty({
    enum: ['weak', 'moderate', 'strong'],
  })
  strength!: 'weak' | 'moderate' | 'strong';

  @ApiProperty()
  sampleSize!: number;

  @ApiProperty()
  insight!: string;
}

class ReportRiskPatternDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  occurrenceRateBeforeCrisis!: number;

  @ApiProperty()
  evidenceCount!: number;

  @ApiProperty({
    enum: ['MEDIUM', 'HIGH'],
  })
  strength!: 'MEDIUM' | 'HIGH';
}

class ReportPersonalizedWeightDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  personalizedWeight!: number;

  @ApiProperty()
  evidenceCount!: number;

  @ApiProperty()
  lift!: number;

  @ApiProperty()
  activeOnLatestDay!: boolean;
}

class ReportPersonalizedRiskProfileDto {
  @ApiProperty()
  available!: boolean;

  @ApiProperty({ nullable: true })
  currentPersonalizedScore!: number | null;

  @ApiProperty({ nullable: true })
  baselineScore!: number | null;

  @ApiPropertyOptional({ nullable: true })
  summary!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'date-time' })
  lastAnalyzedAt!: Date | null;

  @ApiProperty({ type: [ReportRiskPatternDto] })
  triggerPatterns!: ReportRiskPatternDto[];

  @ApiProperty({ type: [ReportPersonalizedWeightDto] })
  topWeights!: ReportPersonalizedWeightDto[];
}

export class ReportStructuredDataDto {
  @ApiProperty({ type: ReportMetadataDto })
  metadata!: ReportMetadataDto;

  @ApiProperty({ type: ReportOverviewDto })
  overview!: ReportOverviewDto;

  @ApiProperty({ type: ReportMetricEvolutionDto })
  painEvolution!: ReportMetricEvolutionDto;

  @ApiProperty({ type: ReportSleepEvolutionDto })
  sleepEvolution!: ReportSleepEvolutionDto;

  @ApiProperty({ type: ReportMetricEvolutionDto })
  fatigueEvolution!: ReportMetricEvolutionDto;

  @ApiProperty({ type: ReportMetricEvolutionDto })
  moodEvolution!: ReportMetricEvolutionDto;

  @ApiProperty({ type: ReportPainPatternsDto })
  painPatterns!: ReportPainPatternsDto;

  @ApiProperty({ type: [ReportRecurringTriggerDto] })
  recurringTriggers!: ReportRecurringTriggerDto[];

  @ApiProperty({ type: ReportCrisisProbabilityDto })
  crisisProbability!: ReportCrisisProbabilityDto;

  @ApiProperty({ type: [ReportCorrelationDto] })
  correlations!: ReportCorrelationDto[];

  @ApiProperty({ type: ReportPersonalizedRiskProfileDto })
  personalizedRiskProfile!: ReportPersonalizedRiskProfileDto;
}

export class ReportResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ReportPeriod })
  period!: ReportPeriod;

  @ApiProperty({ enum: ReportStatus })
  status!: ReportStatus;

  @ApiProperty({ format: 'date' })
  periodStart!: string;

  @ApiProperty({ format: 'date' })
  periodEnd!: string;

  @ApiPropertyOptional({ nullable: true, format: 'date-time' })
  generatedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  fileUrl!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: ReportStructuredDataDto, nullable: true })
  data!: ReportStructuredDataDto | null;
}
