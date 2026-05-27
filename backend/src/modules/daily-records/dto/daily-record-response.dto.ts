import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeatherSnapshotDto } from '@/modules/weather/weather.types';

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

  @ApiProperty()
  mood!: number;

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
  painTriggers?: string[];

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
