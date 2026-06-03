import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { WeatherSnapshotDto } from '@/modules/weather/weather.types';
import { SymptomEntryInputDto } from './symptom-entry-input.dto';
import { SymptomSignalInputDto } from './symptom-signal-input.dto';

export class CreateDailyRecordDto {
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  recordDate?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  painLevel?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  sleepHours?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  sleepQuality?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  fatigueLevel?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  mood?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  moodLevel?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  stressLevel?: number;

  @ApiPropertyOptional({
    description: 'Minutes of physical activity during the day.',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  physicalActivity?: number;

  @ApiPropertyOptional({
    description: 'Alias for physical activity minutes.',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  physicalActivityMinutes?: number;

  @ApiPropertyOptional({
    description: 'Hydration in liters.',
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(15)
  hydration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  medicationTaken?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  weatherFeeling?: string;

  @ApiPropertyOptional({
    description: 'Perceived impact of the weather on the user during the day.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  weatherImpact?: string;

  @ApiPropertyOptional({
    type: WeatherSnapshotDto,
    description: 'Automatic weather snapshot stored for the daily record.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeatherSnapshotDto)
  weatherSnapshot?: WeatherSnapshotDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  painType?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  painAreas?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  frontPainAreas?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  backPainAreas?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  painTriggers?: string[];

  @ApiPropertyOptional({
    type: SymptomSignalInputDto,
    description: 'Structured symptom signal linked to the daily record.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SymptomSignalInputDto)
  symptomSignal?: SymptomSignalInputDto;

  @ApiPropertyOptional({
    type: [SymptomEntryInputDto],
    description: 'Structured symptom entries linked to the daily record.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @ValidateNested({ each: true })
  @Type(() => SymptomEntryInputDto)
  symptomEntries?: SymptomEntryInputDto[];
}
