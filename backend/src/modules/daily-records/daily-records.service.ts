import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { normalizeDateOnly } from '@/common/utils/date.util';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import { PrismaService } from '@/database/prisma.service';
import { CrisisPredictionService } from '@/modules/crisis-prediction/crisis-prediction.service';
import { WeatherService } from '@/modules/weather/weather.service';
import {
  buildWeatherMetadata,
  normalizeWeatherSnapshot,
  parseWeatherSnapshotFromMetadata,
  type WeatherSnapshot,
} from '@/modules/weather/weather.types';
import type { CreateDailyRecordDto } from './dto/create-daily-record.dto';
import type { DailyRecordQueryDto } from './dto/daily-record-query.dto';
import type { UpdateDailyRecordDto } from './dto/update-daily-record.dto';
import {
  type DailyRecordDetails,
  dailyRecordResponseSelect,
} from './daily-records.select';

@Injectable()
export class DailyRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crisisPredictionService: CrisisPredictionService,
    private readonly weatherService: WeatherService,
  ) {}

  async create(userId: string, dto: CreateDailyRecordDto): Promise<unknown> {
    const recordDate = dto.recordDate
      ? normalizeDateOnly(dto.recordDate)
      : normalizeDateOnly(new Date());
    const weatherSnapshot = await this.resolveWeatherSnapshot(
      userId,
      recordDate,
      dto.weatherSnapshot,
    );
    const weatherImpact = this.normalizeText(
      dto.weatherImpact ?? dto.weatherFeeling,
    );

    const record = await this.prisma.dailyRecord.create({
      data: {
        userId,
        recordDate,
        painLevel:
          dto.painLevel ??
          this.inferPainLevel(dto.fatigueLevel, dto.stressLevel, dto.mood),
        painType: this.normalizeText(dto.painType),
        painAreas: this.normalizeStringArray(dto.painAreas),
        painTriggers: this.normalizeStringArray(dto.painTriggers),
        fatigueLevel: dto.fatigueLevel,
        sleepHours: dto.sleepHours,
        sleepQuality: dto.sleepQuality,
        stressLevel: dto.stressLevel,
        moodLevel: dto.mood,
        exerciseMinutes: dto.physicalActivity,
        waterIntakeLiters: dto.hydration,
        medicationAdherence: dto.medicationTaken,
        weatherFeeling: weatherImpact,
        metadata: buildWeatherMetadata(undefined, weatherSnapshot),
        notes: dto.notes?.trim(),
      },
      select: {
        id: true,
      },
    });

    await this.crisisPredictionService.upsertForDailyRecord(userId, record.id);
    return this.findOneForUser(userId, record.id);
  }

  async listForUser(
    userId: string,
    query: DailyRecordQueryDto,
  ): Promise<{
    items: Array<ReturnType<DailyRecordsService['mapRecord']>>;
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where: Prisma.DailyRecordWhereInput = {
      userId,
      ...(query.dateFrom || query.dateTo
        ? {
            recordDate: {
              gte: query.dateFrom
                ? normalizeDateOnly(query.dateFrom)
                : undefined,
              lte: query.dateTo ? normalizeDateOnly(query.dateTo) : undefined,
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.dailyRecord.findMany({
        where,
        select: dailyRecordResponseSelect,
        orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.dailyRecord.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapRecord(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findOneForUser(userId: string, id: string): Promise<unknown> {
    const record = await this.prisma.dailyRecord.findFirst({
      where: {
        id,
        userId,
      },
      select: dailyRecordResponseSelect,
    });

    if (!record) {
      throw new NotFoundException('Daily record not found.');
    }

    return this.mapRecord(record);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateDailyRecordDto,
  ): Promise<unknown> {
    const existingRecord = await this.prisma.dailyRecord.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        recordDate: true,
        painLevel: true,
        fatigueLevel: true,
        stressLevel: true,
        moodLevel: true,
        metadata: true,
      },
    });

    if (!existingRecord) {
      throw new NotFoundException('Daily record not found.');
    }

    const fatigueLevel = dto.fatigueLevel ?? existingRecord.fatigueLevel;
    const stressLevel = dto.stressLevel ?? existingRecord.stressLevel;
    const mood = dto.mood ?? existingRecord.moodLevel;
    const recordDate =
      dto.recordDate === undefined
        ? existingRecord.recordDate
        : normalizeDateOnly(dto.recordDate);
    const weatherSnapshot = await this.resolveWeatherSnapshot(
      userId,
      recordDate,
      dto.weatherSnapshot,
      existingRecord.metadata,
    );
    const weatherImpact = this.normalizeText(
      dto.weatherImpact ?? dto.weatherFeeling,
    );

    await this.prisma.dailyRecord.update({
      where: {
        id,
      },
      data: {
        recordDate: dto.recordDate === undefined ? undefined : recordDate,
        painLevel:
          dto.painLevel ?? this.inferPainLevel(fatigueLevel, stressLevel, mood),
        painType:
          dto.painType === undefined
            ? undefined
            : (this.normalizeText(dto.painType) ?? null),
        painAreas:
          dto.painAreas === undefined
            ? undefined
            : this.normalizeStringArray(dto.painAreas),
        painTriggers:
          dto.painTriggers === undefined
            ? undefined
            : this.normalizeStringArray(dto.painTriggers),
        fatigueLevel: dto.fatigueLevel,
        sleepHours: dto.sleepHours,
        sleepQuality: dto.sleepQuality,
        stressLevel: dto.stressLevel,
        moodLevel: dto.mood,
        exerciseMinutes: dto.physicalActivity,
        waterIntakeLiters: dto.hydration,
        medicationAdherence: dto.medicationTaken,
        weatherFeeling:
          dto.weatherImpact === undefined && dto.weatherFeeling === undefined
            ? undefined
            : (weatherImpact ?? null),
        metadata: buildWeatherMetadata(
          existingRecord.metadata,
          weatherSnapshot,
        ),
        notes: dto.notes?.trim(),
      },
    });

    await this.crisisPredictionService.upsertForDailyRecord(userId, id);
    return this.findOneForUser(userId, id);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    await this.findOneForUser(userId, id);

    await this.prisma.dailyRecord.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Daily record deleted successfully.',
    };
  }

  private inferPainLevel(
    fatigueLevel: number,
    stressLevel: number,
    mood: number,
  ): number {
    const inferred = Math.round((fatigueLevel + stressLevel + (10 - mood)) / 3);
    return Math.min(Math.max(inferred, 0), 10);
  }

  private normalizeStringArray(values?: string[]): string[] {
    if (!values || values.length === 0) {
      return [];
    }

    return Array.from(
      new Set(
        values
          .map((value) => this.normalizeText(value))
          .filter((value): value is string => Boolean(value)),
      ),
    );
  }

  private normalizeText(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private async resolveWeatherSnapshot(
    userId: string,
    recordDate: Date,
    explicitSnapshot?: unknown,
    metadata?: Prisma.JsonValue | null,
  ): Promise<WeatherSnapshot | null> {
    const providedSnapshot =
      explicitSnapshot === undefined
        ? null
        : normalizeWeatherSnapshot(explicitSnapshot);

    if (providedSnapshot) {
      return providedSnapshot;
    }

    const storedInMetadata = parseWeatherSnapshotFromMetadata(metadata);

    if (storedInMetadata) {
      return storedInMetadata;
    }

    return this.weatherService.findLatestSnapshotForUserDate(
      userId,
      recordDate,
    );
  }

  private mapRecord(record: DailyRecordDetails): {
    id: string;
    recordDate: string;
    painLevel: number;
    sleepHours: number | null;
    sleepQuality: number | null;
    fatigueLevel: number;
    mood: number;
    stressLevel: number;
    physicalActivity: number | null;
    medicationTaken: boolean | null;
    hydration: number | null;
    weatherFeeling: string | null;
    weatherImpact: string | null;
    weatherSnapshot: WeatherSnapshot | null;
    notes: string | null;
    painType: string | null;
    painAreas: string[];
    painTriggers: string[];
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: record.id,
      recordDate: this.formatDateOnly(record.recordDate),
      painLevel: record.painLevel,
      sleepHours: record.sleepHours,
      sleepQuality: record.sleepQuality,
      fatigueLevel: record.fatigueLevel,
      mood: record.moodLevel,
      stressLevel: record.stressLevel,
      physicalActivity: record.exerciseMinutes,
      medicationTaken: record.medicationAdherence,
      hydration: record.waterIntakeLiters,
      weatherFeeling: record.weatherFeeling,
      weatherImpact: record.weatherFeeling,
      weatherSnapshot: parseWeatherSnapshotFromMetadata(record.metadata),
      notes: record.notes,
      painType: record.painType,
      painAreas: record.painAreas,
      painTriggers: record.painTriggers,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private formatDateOnly(date: Date): string {
    return normalizeDateOnly(date).toISOString().slice(0, 10);
  }
}
