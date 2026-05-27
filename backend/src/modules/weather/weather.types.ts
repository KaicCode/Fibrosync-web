import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;

export type WeatherDataSource =
  | 'live'
  | 'cache'
  | 'database-fallback'
  | 'safe-fallback';

export interface WeatherSnapshot {
  temperature: number;
  humidity: number;
  apparentTemperature: number;
  precipitation: number;
  pressure: number;
  windSpeed: number;
  weatherCode: number;
  source?: WeatherDataSource;
  fetchedAt?: string;
}

export interface WeatherMetadata {
  weatherSnapshot?: WeatherSnapshot | null;
}

export interface OpenMeteoCurrentPayload {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    surface_pressure?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
}

const WEATHER_DATA_SOURCES: WeatherDataSource[] = [
  'live',
  'cache',
  'database-fallback',
  'safe-fallback',
];

export class CurrentWeatherQueryDto {
  @ApiProperty({ example: -6.77 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ example: -43.02 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  lon!: number;
}

export class WeatherSnapshotDto implements WeatherSnapshot {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  temperature!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  humidity!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  apparentTemperature!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  precipitation!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  pressure!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  windSpeed!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  weatherCode!: number;

  @ApiPropertyOptional({ enum: WEATHER_DATA_SOURCES })
  @IsOptional()
  @IsIn(WEATHER_DATA_SOURCES)
  source?: WeatherDataSource;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  fetchedAt?: string;
}

export function normalizeWeatherSnapshot(
  value: unknown,
): WeatherSnapshot | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const requiredKeys = [
    'temperature',
    'humidity',
    'apparentTemperature',
    'precipitation',
    'pressure',
    'windSpeed',
    'weatherCode',
  ] as const;

  if (
    requiredKeys.some((key) => typeof candidate[key] !== 'number') ||
    !Number.isFinite(candidate.temperature) ||
    !Number.isFinite(candidate.humidity) ||
    !Number.isFinite(candidate.apparentTemperature) ||
    !Number.isFinite(candidate.precipitation) ||
    !Number.isFinite(candidate.pressure) ||
    !Number.isFinite(candidate.windSpeed) ||
    !Number.isFinite(candidate.weatherCode)
  ) {
    return null;
  }

  return {
    temperature: Number(candidate.temperature),
    humidity: Number(candidate.humidity),
    apparentTemperature: Number(candidate.apparentTemperature),
    precipitation: Number(candidate.precipitation),
    pressure: Number(candidate.pressure),
    windSpeed: Number(candidate.windSpeed),
    weatherCode: Math.round(Number(candidate.weatherCode)),
    source:
      typeof candidate.source === 'string' &&
      WEATHER_DATA_SOURCES.includes(candidate.source as WeatherDataSource)
        ? (candidate.source as WeatherDataSource)
        : undefined,
    fetchedAt:
      typeof candidate.fetchedAt === 'string' ? candidate.fetchedAt : undefined,
  };
}

export function parseWeatherSnapshotFromMetadata(
  metadata: Prisma.JsonValue | null | undefined,
): WeatherSnapshot | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  return normalizeWeatherSnapshot(
    (metadata as Record<string, unknown>).weatherSnapshot,
  );
}

export function buildWeatherMetadata(
  metadata: Prisma.JsonValue | null | undefined,
  weatherSnapshot: WeatherSnapshot | null,
): Prisma.InputJsonValue | undefined {
  const base =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};

  if (weatherSnapshot) {
    base.weatherSnapshot = weatherSnapshot;
  } else {
    delete base.weatherSnapshot;
  }

  return Object.keys(base).length > 0
    ? (base as Prisma.InputJsonValue)
    : undefined;
}

export function buildSafeWeatherFallback(): WeatherSnapshot {
  return {
    temperature: 24,
    humidity: 55,
    apparentTemperature: 24,
    precipitation: 0,
    pressure: 1013,
    windSpeed: 8,
    weatherCode: 1,
    source: 'safe-fallback',
    fetchedAt: new Date().toISOString(),
  };
}

export function isWeatherRiskElevated(
  weatherSnapshot: WeatherSnapshot | null | undefined,
): boolean {
  if (!weatherSnapshot) {
    return false;
  }

  return (
    (weatherSnapshot.temperature < 20 && weatherSnapshot.humidity > 70) ||
    weatherSnapshot.pressure < 1000 ||
    weatherSnapshot.precipitation > 0
  );
}
