import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { normalizeDateOnly } from '@/common/utils/date.util';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import { PrismaService } from '@/database/prisma.service';
import { CrisisPredictionService } from '@/modules/crisis-prediction/crisis-prediction.service';
import type { CreateDailyRecordDto } from './dto/create-daily-record.dto';
import type { DailyRecordQueryDto } from './dto/daily-record-query.dto';
import type { UpdateDailyRecordDto } from './dto/update-daily-record.dto';
import {
  type DailyRecordDetails,
  dailyRecordResponseSelect,
} from './daily-records.select';

type PainMetadata = {
  painType?: string;
  painAreas: string[];
  painTriggers: string[];
};

@Injectable()
export class DailyRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crisisPredictionService: CrisisPredictionService,
  ) {}

  async create(userId: string, dto: CreateDailyRecordDto): Promise<unknown> {
    const recordDate = normalizeDateOnly(new Date());
    await this.ensureNoDuplicateRecord(userId, recordDate);

    const record = await this.prisma.dailyRecord.create({
      data: {
        userId,
        recordDate,
        painLevel:
          dto.painLevel ??
          this.inferPainLevel(dto.fatigueLevel, dto.stressLevel, dto.mood),
        fatigueLevel: dto.fatigueLevel,
        sleepHours: dto.sleepHours,
        sleepQuality: dto.sleepQuality,
        stressLevel: dto.stressLevel,
        moodLevel: dto.mood,
        exerciseMinutes: dto.physicalActivity,
        waterIntakeLiters: dto.hydration,
        medicationAdherence: dto.medicationTaken,
        weatherFeeling: dto.weatherFeeling?.trim(),
        notes: dto.notes?.trim(),
        metadata: this.resolvePainMetadata(dto),
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
        orderBy: {
          recordDate: 'desc',
        },
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

    await this.prisma.dailyRecord.update({
      where: {
        id,
      },
      data: {
        painLevel:
          dto.painLevel ?? this.inferPainLevel(fatigueLevel, stressLevel, mood),
        fatigueLevel: dto.fatigueLevel,
        sleepHours: dto.sleepHours,
        sleepQuality: dto.sleepQuality,
        stressLevel: dto.stressLevel,
        moodLevel: dto.mood,
        exerciseMinutes: dto.physicalActivity,
        waterIntakeLiters: dto.hydration,
        medicationAdherence: dto.medicationTaken,
        weatherFeeling: dto.weatherFeeling?.trim(),
        notes: dto.notes?.trim(),
        metadata: this.resolvePainMetadata(dto, existingRecord.metadata),
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

  private async ensureNoDuplicateRecord(
    userId: string,
    recordDate: Date,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.dailyRecord.findFirst({
      where: {
        userId,
        recordDate,
        id: excludeId
          ? {
              not: excludeId,
            }
          : undefined,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'A daily record for this date already exists.',
      );
    }
  }

  private inferPainLevel(
    fatigueLevel: number,
    stressLevel: number,
    mood: number,
  ): number {
    const inferred = Math.round((fatigueLevel + stressLevel + (10 - mood)) / 3);
    return Math.min(Math.max(inferred, 0), 10);
  }

  private resolvePainMetadata(
    dto: Pick<CreateDailyRecordDto, 'painType' | 'painAreas' | 'painTriggers'>,
    existingMetadata?: Prisma.JsonValue | null,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    const existing = this.parsePainMetadata(existingMetadata);

    const painType =
      dto.painType === undefined
        ? existing.painType
        : this.normalizeText(dto.painType);
    const painAreas =
      dto.painAreas === undefined
        ? existing.painAreas
        : this.normalizeStringArray(dto.painAreas);
    const painTriggers =
      dto.painTriggers === undefined
        ? existing.painTriggers
        : this.normalizeStringArray(dto.painTriggers);

    if (!painType && painAreas.length === 0 && painTriggers.length === 0) {
      return existingMetadata === undefined ? undefined : Prisma.JsonNull;
    }

    return {
      painType,
      painAreas,
      painTriggers,
    } satisfies PainMetadata;
  }

  private parsePainMetadata(metadata?: Prisma.JsonValue | null): PainMetadata {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {
        painAreas: [],
        painTriggers: [],
      };
    }

    const source = metadata as Record<string, unknown>;

    return {
      painType:
        typeof source.painType === 'string' ? source.painType : undefined,
      painAreas: this.readStringArray(source.painAreas),
      painTriggers: this.readStringArray(source.painTriggers),
    };
  }

  private readStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return this.normalizeStringArray(
      value.filter((item): item is string => typeof item === 'string'),
    );
  }

  private normalizeStringArray(values: string[]): string[] {
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

  private mapRecord(record: DailyRecordDetails): {
    id: string;
    recordDate: Date;
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
    notes: string | null;
    painType: string | null;
    painAreas: string[];
    painTriggers: string[];
    createdAt: Date;
    updatedAt: Date;
  } {
    const painMetadata = this.parsePainMetadata(record.metadata);

    return {
      id: record.id,
      recordDate: record.recordDate,
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
      notes: record.notes,
      painType: painMetadata.painType ?? null,
      painAreas: painMetadata.painAreas,
      painTriggers: painMetadata.painTriggers,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
