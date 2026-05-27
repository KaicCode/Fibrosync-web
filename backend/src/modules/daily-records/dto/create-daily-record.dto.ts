import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsArray,
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

  @ApiProperty({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  fatigueLevel!: number;

  @ApiProperty({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  mood!: number;

  @ApiProperty({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  stressLevel!: number;

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
  painTriggers?: string[];
}
