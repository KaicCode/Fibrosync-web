import { Injectable, Logger } from '@nestjs/common';
import { addDays, normalizeDateOnly } from '@/common/utils/date.util';
import { PrismaService } from '@/database/prisma.service';
import type {
  OpenMeteoCurrentPayload,
  WeatherDataSource,
  WeatherSnapshot,
} from './weather.types';
import {
  WEATHER_CACHE_TTL_MS,
  buildSafeWeatherFallback,
} from './weather.types';

interface CachedWeatherEntry {
  expiresAt: number;
  weather: WeatherSnapshot;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly cache = new Map<string, CachedWeatherEntry>();

  constructor(private readonly prisma: PrismaService) {}

  async getCurrentWeather(
    userId: string,
    lat: number,
    lon: number,
  ): Promise<WeatherSnapshot> {
    const cacheKey = this.buildCacheKey(lat, lon);
    const cached = this.getCachedWeather(cacheKey);

    if (cached) {
      await this.persistUserWeatherRecord(userId, cached);
      return cached;
    }

    try {
      const currentWeather = await this.fetchCurrentWeather(lat, lon);
      this.cache.set(cacheKey, {
        weather: currentWeather,
        expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
      });

      await this.persistUserWeatherRecord(userId, currentWeather);
      return currentWeather;
    } catch (error) {
      this.logger.warn(
        `Weather fetch failed for user ${userId}: ${this.describeError(error)}`,
      );

      return this.resolveFallbackWeather(userId, cacheKey);
    }
  }

  async findLatestSnapshotForUserDate(
    userId: string,
    recordDate: Date,
  ): Promise<WeatherSnapshot | null> {
    const dayStart = normalizeDateOnly(recordDate);
    const dayEnd = addDays(dayStart, 1);
    const record = await this.prisma.weatherRecord.findFirst({
      where: {
        userId,
        createdAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return record ? this.mapStoredRecord(record, 'database-fallback') : null;
  }

  async findLatestSnapshotForUser(
    userId: string,
  ): Promise<WeatherSnapshot | null> {
    const record = await this.prisma.weatherRecord.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return record ? this.mapStoredRecord(record, 'database-fallback') : null;
  }

  private async fetchCurrentWeather(
    lat: number,
    lon: number,
  ): Promise<WeatherSnapshot> {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lon.toString());
    url.searchParams.set(
      'current',
      [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation',
        'surface_pressure',
        'wind_speed_10m',
        'weather_code',
      ].join(','),
    );
    url.searchParams.set('wind_speed_unit', 'kmh');

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo returned ${response.status}.`);
    }

    const payload = (await response.json()) as OpenMeteoCurrentPayload;
    const current = payload.current;

    if (
      current?.temperature_2m === undefined ||
      current.relative_humidity_2m === undefined ||
      current.apparent_temperature === undefined ||
      current.precipitation === undefined ||
      current.surface_pressure === undefined ||
      current.wind_speed_10m === undefined ||
      current.weather_code === undefined
    ) {
      throw new Error(
        'Open-Meteo response is missing expected current values.',
      );
    }

    return {
      temperature: this.round(current.temperature_2m),
      humidity: this.round(current.relative_humidity_2m),
      apparentTemperature: this.round(current.apparent_temperature),
      precipitation: this.round(current.precipitation),
      pressure: this.round(current.surface_pressure),
      windSpeed: this.round(current.wind_speed_10m),
      weatherCode: Math.round(current.weather_code),
      source: 'live',
      fetchedAt: new Date().toISOString(),
    };
  }

  private async resolveFallbackWeather(
    userId: string,
    cacheKey: string,
  ): Promise<WeatherSnapshot> {
    const cached = this.getCachedWeather(cacheKey);

    if (cached) {
      return cached;
    }

    const latestStored = await this.findLatestSnapshotForUser(userId);

    if (latestStored) {
      return latestStored;
    }

    return buildSafeWeatherFallback();
  }

  private getCachedWeather(cacheKey: string): WeatherSnapshot | null {
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return null;
    }

    if (cached.expiresAt <= Date.now()) {
      this.cache.delete(cacheKey);
      return null;
    }

    return {
      ...cached.weather,
      source: 'cache',
    };
  }

  private async persistUserWeatherRecord(
    userId: string,
    weather: WeatherSnapshot,
  ): Promise<void> {
    const latestRecord = await this.prisma.weatherRecord.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (
      latestRecord &&
      Date.now() - latestRecord.createdAt.getTime() < WEATHER_CACHE_TTL_MS &&
      latestRecord.temperature === weather.temperature &&
      latestRecord.humidity === weather.humidity &&
      latestRecord.apparentTemperature === weather.apparentTemperature &&
      latestRecord.precipitation === weather.precipitation &&
      latestRecord.pressure === weather.pressure &&
      latestRecord.windSpeed === weather.windSpeed &&
      latestRecord.weatherCode === weather.weatherCode
    ) {
      return;
    }

    await this.prisma.weatherRecord.create({
      data: {
        userId,
        temperature: weather.temperature,
        humidity: weather.humidity,
        apparentTemperature: weather.apparentTemperature,
        precipitation: weather.precipitation,
        pressure: weather.pressure,
        windSpeed: weather.windSpeed,
        weatherCode: weather.weatherCode,
      },
    });
  }

  private mapStoredRecord(
    record: {
      temperature: number;
      humidity: number;
      apparentTemperature: number;
      precipitation: number;
      pressure: number;
      windSpeed: number;
      weatherCode: number;
      createdAt: Date;
    },
    source: WeatherDataSource,
  ): WeatherSnapshot {
    return {
      temperature: this.round(record.temperature),
      humidity: this.round(record.humidity),
      apparentTemperature: this.round(record.apparentTemperature),
      precipitation: this.round(record.precipitation),
      pressure: this.round(record.pressure),
      windSpeed: this.round(record.windSpeed),
      weatherCode: record.weatherCode,
      source,
      fetchedAt: record.createdAt.toISOString(),
    };
  }

  private buildCacheKey(lat: number, lon: number): string {
    return `${lat.toFixed(3)}:${lon.toFixed(3)}`;
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }

  private describeError(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
