import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeatherSnapshotDto } from '@/modules/weather/weather.types';

class DailyRecordSymptomSignalResponseDto {
  @ApiPropertyOptional()
  id?: string;

  @ApiPropertyOptional()
  dailyRecordId?: string | null;

  @ApiProperty()
  fatigueLevel!: number;

  @ApiProperty()
  sleepQuality!: number;

  @ApiProperty()
  stiffness!: number;

  @ApiProperty()
  mood!: number;

  @ApiProperty()
  stress!: number;

  @ApiProperty()
  cognitiveFog!: boolean;

  @ApiPropertyOptional()
  cognitiveFogLevel?: number | null;

  @ApiProperty()
  sensitivityLight!: boolean;

  @ApiPropertyOptional()
  sensitivityLightLevel?: number | null;

  @ApiProperty()
  sensitivityNoise!: boolean;

  @ApiPropertyOptional()
  sensitivityNoiseLevel?: number | null;

  @ApiProperty()
  digestiveIssues!: boolean;

  @ApiPropertyOptional()
  digestiveIssuesLevel?: number | null;

  @ApiProperty()
  headache!: boolean;

  @ApiPropertyOptional()
  headacheLevel?: number | null;

  @ApiProperty()
  anxiety!: boolean;

  @ApiPropertyOptional()
  anxietyLevel?: number | null;

  @ApiProperty()
  depression!: boolean;

  @ApiPropertyOptional()
  depressionLevel?: number | null;

  @ApiPropertyOptional()
  bodyTemperatureFeeling?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;
}

class DailyRecordSymptomEntryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  symptomId!: string;

  @ApiProperty()
  symptomName!: string;

  @ApiProperty()
  severity!: number;

  @ApiPropertyOptional()
  durationMinutes?: number | null;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class DailyRecordResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ format: 'date' })
  recordDate!: string;

  @ApiProperty()
  painLevel!: number;

  @ApiPropertyOptional()
  sleepHours?: number | null;

  @ApiPropertyOptional()
  sleepQuality?: number | null;

  @ApiProperty()
  fatigueLevel!: number;

  @ApiPropertyOptional()
  batteryLevel?: number | null;

  @ApiProperty()
  mood!: number;

  @ApiProperty()
  moodLevel!: number;

  @ApiProperty()
  stressLevel!: number;

  @ApiPropertyOptional()
  physicalActivity?: number | null;

  @ApiPropertyOptional()
  medicationTaken?: boolean | null;

  @ApiPropertyOptional()
  hydration?: number | null;

  @ApiPropertyOptional()
  weatherFeeling?: string | null;

  @ApiPropertyOptional()
  weatherImpact?: string | null;

  @ApiPropertyOptional({ type: WeatherSnapshotDto, nullable: true })
  weatherSnapshot?: WeatherSnapshotDto | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  painType?: string | null;

  @ApiPropertyOptional({ type: [String] })
  painAreas?: string[];

  @ApiPropertyOptional({ type: [String] })
  frontPainAreas?: string[];

  @ApiPropertyOptional({ type: [String] })
  backPainAreas?: string[];

  @ApiPropertyOptional({ type: [String] })
  painTriggers?: string[];

  @ApiProperty()
  derivedSignals!: boolean;

  @ApiProperty()
  dataReliabilityScore!: number;

  @ApiProperty()
  dataReliabilityLabel!: string;

  @ApiPropertyOptional({
    type: DailyRecordSymptomSignalResponseDto,
    nullable: true,
  })
  symptomSignal?: DailyRecordSymptomSignalResponseDto | null;

  @ApiPropertyOptional({ type: [DailyRecordSymptomEntryResponseDto] })
  symptomEntries?: DailyRecordSymptomEntryResponseDto[];

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
