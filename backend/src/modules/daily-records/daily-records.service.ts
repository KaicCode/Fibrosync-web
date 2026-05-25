import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
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
        painLevel: this.inferPainLevel(
          dto.fatigueLevel,
          dto.stressLevel,
          dto.mood,
        ),
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
        fatigueLevel: true,
        stressLevel: true,
        moodLevel: true,
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
        painLevel: this.inferPainLevel(fatigueLevel, stressLevel, mood),
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

  private mapRecord(record: DailyRecordDetails): {
    id: string;
    recordDate: Date;
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
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: record.id,
      recordDate: record.recordDate,
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
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
