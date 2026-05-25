import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DailyRecordResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ format: 'date-time' })
  recordDate!: Date;

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
  notes?: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
