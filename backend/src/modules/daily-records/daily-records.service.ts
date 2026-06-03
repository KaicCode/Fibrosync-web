import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SymptomCategory } from '@prisma/client';
import { calculateDataReliability } from '@/common/utils/data-reliability.util';
import { normalizeDateOnly } from '@/common/utils/date.util';
import { normalizeText } from '@/common/utils/normalize-text.util';
import {
  buildSymptomSignalLevels,
  resolveSymptomFlag,
  symptomCatalogDefinitions,
  type SymptomSignalInput,
} from '@/common/utils/symptom-signal.util';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import { slugify } from '@/common/utils/slugify.util';
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
import type { SymptomEntryInputDto } from './dto/symptom-entry-input.dto';
import type { SymptomSignalInputDto } from './dto/symptom-signal-input.dto';
import type { UpdateDailyRecordDto } from './dto/update-daily-record.dto';
import {
  dailyRecordResponseSelect,
  type DailyRecordDetails,
} from './daily-records.select';

interface PainAreaPartitions {
  frontPainAreas: string[];
  backPainAreas: string[];
}

interface ResolvedSymptomSignalInput {
  fatigueLevel: number;
  sleepQuality: number;
  stiffness: number;
  mood: number;
  stress: number;
  cognitiveFog: boolean;
  cognitiveFogLevel: number | null;
  sensitivityLight: boolean;
  sensitivityLightLevel: number | null;
  sensitivityNoise: boolean;
  sensitivityNoiseLevel: number | null;
  digestiveIssues: boolean;
  digestiveIssuesLevel: number | null;
  headache: boolean;
  headacheLevel: number | null;
  anxiety: boolean;
  anxietyLevel: number | null;
  depression: boolean;
  depressionLevel: number | null;
  bodyTemperatureFeeling: string | null;
  notes: string | null;
}

interface ResolvedSymptomEntryInput {
  symptomId?: string;
  symptomName: string;
  category: SymptomCategory;
  severity: number;
  durationMinutes?: number | null;
  notes?: string | null;
}

interface ResolvedRecordInput {
  recordDate: Date;
  painLevel: number;
  fatigueLevel: number;
  stressLevel: number;
  moodLevel: number;
  sleepQuality: number;
  sleepHours: number | null;
  physicalActivity: number | null;
  hydration: number | null;
  medicationTaken: boolean | null;
  weatherFeeling: string | null;
  weatherSnapshot: WeatherSnapshot | null;
  notes: string | null;
  painType: string | null;
  painAreas: string[];
  frontPainAreas: string[];
  backPainAreas: string[];
  painTriggers: string[];
  derivedSignals: boolean;
  symptomSignal: ResolvedSymptomSignalInput;
  symptomEntries: ResolvedSymptomEntryInput[];
}

const CATEGORY_BY_NAME = new Map(
  symptomCatalogDefinitions.map((definition) => [
    normalizeText(definition.label),
    definition.category,
  ]),
);

const NAME_BY_KEY = new Map(
  symptomCatalogDefinitions.map((definition) => [
    definition.key,
    definition.label,
  ]),
);

@Injectable()
export class DailyRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crisisPredictionService: CrisisPredictionService,
    private readonly weatherService: WeatherService,
  ) {}

  async create(userId: string, dto: CreateDailyRecordDto): Promise<unknown> {
    const resolved = await this.resolveRecordInput(userId, dto);

    const record = await this.prisma.$transaction(async (tx) => {
      const createdRecord = await tx.dailyRecord.create({
        data: {
          userId,
          recordDate: resolved.recordDate,
          painLevel: resolved.painLevel,
          painType: resolved.painType,
          painAreas: resolved.painAreas,
          painTriggers: resolved.painTriggers,
          fatigueLevel: resolved.fatigueLevel,
          sleepHours: resolved.sleepHours,
          sleepQuality: resolved.sleepQuality,
          stressLevel: resolved.stressLevel,
          moodLevel: resolved.moodLevel,
          exerciseMinutes: resolved.physicalActivity,
          waterIntakeLiters: resolved.hydration,
          medicationAdherence: resolved.medicationTaken,
          weatherFeeling: resolved.weatherFeeling,
          derivedSignals: resolved.derivedSignals,
          metadata: this.buildRecordMetadata(undefined, resolved),
          notes: resolved.notes,
        },
        select: {
          id: true,
        },
      });

      await this.createLinkedSymptomSignal(
        tx,
        userId,
        createdRecord.id,
        resolved.symptomSignal,
      );
      await this.persistWeatherSnapshot(tx, userId, resolved.weatherSnapshot);
      await this.replaceSymptomEntries(
        tx,
        createdRecord.id,
        resolved.symptomEntries,
      );

      return createdRecord;
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

    if (query.includeAll) {
      const items = await this.prisma.dailyRecord.findMany({
        where,
        select: dailyRecordResponseSelect,
        orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }],
      });

      return {
        items: items.map((item) => this.mapRecord(item)),
        meta: buildPaginationMeta(items.length, 1, Math.max(items.length, 1)),
      };
    }

    const { page, limit, skip } = resolvePagination(query.page, query.limit);
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
      select: dailyRecordResponseSelect,
    });

    if (!existingRecord) {
      throw new NotFoundException('Daily record not found.');
    }

    const resolved = await this.resolveRecordInput(userId, dto, existingRecord);

    await this.prisma.$transaction(async (tx) => {
      await tx.dailyRecord.update({
        where: {
          id,
        },
        data: {
          recordDate: resolved.recordDate,
          painLevel: resolved.painLevel,
          painType: resolved.painType,
          painAreas: resolved.painAreas,
          painTriggers: resolved.painTriggers,
          fatigueLevel: resolved.fatigueLevel,
          sleepHours: resolved.sleepHours,
          sleepQuality: resolved.sleepQuality,
          stressLevel: resolved.stressLevel,
          moodLevel: resolved.moodLevel,
          exerciseMinutes: resolved.physicalActivity,
          waterIntakeLiters: resolved.hydration,
          medicationAdherence: resolved.medicationTaken,
          weatherFeeling: resolved.weatherFeeling,
          derivedSignals: resolved.derivedSignals,
          metadata: this.buildRecordMetadata(existingRecord.metadata, resolved),
          notes: resolved.notes,
        },
      });

      await this.replaceLinkedSymptomSignal(
        tx,
        userId,
        id,
        resolved.symptomSignal,
      );
      await this.persistWeatherSnapshot(tx, userId, resolved.weatherSnapshot);
      await this.replaceSymptomEntries(tx, id, resolved.symptomEntries);
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

  private async resolveRecordInput(
    userId: string,
    dto: CreateDailyRecordDto | UpdateDailyRecordDto,
    existingRecord?: DailyRecordDetails,
  ): Promise<ResolvedRecordInput> {
    const recordDate =
      dto.recordDate !== undefined
        ? normalizeDateOnly(dto.recordDate)
        : existingRecord
          ? normalizeDateOnly(existingRecord.recordDate)
          : normalizeDateOnly(new Date());

    const moodLevel = this.resolveRequiredNumber(
      'moodLevel',
      dto.moodLevel ?? dto.mood,
      existingRecord?.moodLevel,
    );
    const fatigueLevel = this.resolveRequiredNumber(
      'fatigueLevel',
      dto.fatigueLevel,
      existingRecord?.fatigueLevel,
    );
    const stressLevel = this.resolveRequiredNumber(
      'stressLevel',
      dto.stressLevel,
      existingRecord?.stressLevel,
    );
    const sleepQuality = this.resolveRequiredNumber(
      'sleepQuality',
      dto.sleepQuality,
      existingRecord?.sleepQuality,
    );
    const sleepHours = this.resolveOptionalNumber(
      dto.sleepHours,
      existingRecord?.sleepHours,
      true,
    );

    const weatherSnapshot = await this.resolveWeatherSnapshot(
      userId,
      recordDate,
      dto.weatherSnapshot,
      existingRecord?.metadata,
    );

    const partitions = this.resolvePainAreaPartitions(dto, existingRecord);
    const painAreas =
      dto.painAreas !== undefined
        ? this.normalizeStringArray(dto.painAreas)
        : this.combinePainAreas(partitions);

    const physicalActivity =
      dto.physicalActivity !== undefined ||
      dto.physicalActivityMinutes !== undefined
        ? this.resolveOptionalNumber(
            dto.physicalActivityMinutes ?? dto.physicalActivity,
            null,
            false,
          )
        : this.resolveOptionalNumber(
            existingRecord?.exerciseMinutes,
            null,
            false,
          );

    const hydration =
      dto.hydration !== undefined
        ? this.resolveOptionalNumber(dto.hydration, null, false)
        : this.resolveOptionalNumber(
            existingRecord?.waterIntakeLiters,
            null,
            false,
          );

    const medicationTaken =
      dto.medicationTaken !== undefined
        ? dto.medicationTaken
        : (existingRecord?.medicationAdherence ?? null);

    const notes =
      dto.notes !== undefined
        ? (this.cleanDisplayText(dto.notes) ?? null)
        : (existingRecord?.notes ?? null);

    const painType =
      dto.painType !== undefined
        ? (this.cleanDisplayText(dto.painType) ?? null)
        : (existingRecord?.painType ?? null);

    const painTriggers =
      dto.painTriggers !== undefined
        ? this.normalizeStringArray(dto.painTriggers)
        : (existingRecord?.painTriggers ?? []);

    const weatherFeeling =
      dto.weatherImpact !== undefined || dto.weatherFeeling !== undefined
        ? (this.cleanDisplayText(dto.weatherImpact ?? dto.weatherFeeling) ??
          null)
        : (existingRecord?.weatherFeeling ?? null);

    const painLevel =
      dto.painLevel ??
      existingRecord?.painLevel ??
      this.inferPainLevel(fatigueLevel, stressLevel, moodLevel);

    const symptomSignal = this.resolveSymptomSignalInput(
      dto.symptomSignal,
      {
        fatigueLevel,
        sleepQuality,
        mood: moodLevel,
        stress: stressLevel,
      },
      existingRecord,
    );

    const symptomEntries = this.resolveSymptomEntries(
      dto.symptomEntries,
      symptomSignal,
      existingRecord,
    );

    return {
      recordDate,
      painLevel: Math.min(Math.max(Math.round(painLevel), 0), 10),
      fatigueLevel,
      stressLevel,
      moodLevel,
      sleepQuality,
      sleepHours,
      physicalActivity,
      hydration,
      medicationTaken,
      weatherFeeling,
      weatherSnapshot,
      notes,
      painType,
      painAreas,
      frontPainAreas: partitions.frontPainAreas,
      backPainAreas: partitions.backPainAreas,
      painTriggers,
      derivedSignals: false,
      symptomSignal,
      symptomEntries,
    };
  }

  private resolvePainAreaPartitions(
    dto: CreateDailyRecordDto | UpdateDailyRecordDto,
    existingRecord?: DailyRecordDetails,
  ): PainAreaPartitions {
    if (dto.frontPainAreas !== undefined || dto.backPainAreas !== undefined) {
      return {
        frontPainAreas: this.normalizeStringArray(dto.frontPainAreas),
        backPainAreas: this.normalizeStringArray(dto.backPainAreas),
      };
    }

    if (dto.painAreas !== undefined) {
      return {
        frontPainAreas: [],
        backPainAreas: [],
      };
    }

    return this.parsePainAreaPartitions(existingRecord?.metadata);
  }

  private resolveSymptomSignalInput(
    dto: SymptomSignalInputDto | undefined,
    core: {
      fatigueLevel: number;
      sleepQuality: number;
      mood: number;
      stress: number;
    },
    existingRecord?: DailyRecordDetails,
  ): ResolvedSymptomSignalInput {
    const existingSignal = existingRecord?.symptomSignals[0];
    const merged = dto ?? {};
    const levels = buildSymptomSignalLevels({
      stiffness: merged.stiffness ?? existingSignal?.stiffness ?? 0,
      cognitiveFog: merged.cognitiveFog ?? existingSignal?.cognitiveFog,
      cognitiveFogLevel:
        merged.cognitiveFogLevel ?? existingSignal?.cognitiveFogLevel,
      sensitivityLight:
        merged.sensitivityLight ?? existingSignal?.sensitivityLight,
      sensitivityLightLevel:
        merged.sensitivityLightLevel ?? existingSignal?.sensitivityLightLevel,
      sensitivityNoise:
        merged.sensitivityNoise ?? existingSignal?.sensitivityNoise,
      sensitivityNoiseLevel:
        merged.sensitivityNoiseLevel ?? existingSignal?.sensitivityNoiseLevel,
      digestiveIssues:
        merged.digestiveIssues ?? existingSignal?.digestiveIssues,
      digestiveIssuesLevel:
        merged.digestiveIssuesLevel ?? existingSignal?.digestiveIssuesLevel,
      headache: merged.headache ?? existingSignal?.headache,
      headacheLevel: merged.headacheLevel ?? existingSignal?.headacheLevel,
      anxiety: merged.anxiety ?? existingSignal?.anxiety,
      anxietyLevel: merged.anxietyLevel ?? existingSignal?.anxietyLevel,
      depression: merged.depression ?? existingSignal?.depression,
      depressionLevel:
        merged.depressionLevel ?? existingSignal?.depressionLevel,
    } satisfies SymptomSignalInput);

    return {
      fatigueLevel: core.fatigueLevel,
      sleepQuality: core.sleepQuality,
      stiffness: levels.stiffness ?? 0,
      mood: core.mood,
      stress: core.stress,
      cognitiveFog: resolveSymptomFlag(
        levels.cognitiveFog,
        merged.cognitiveFog ?? existingSignal?.cognitiveFog,
      ),
      cognitiveFogLevel: levels.cognitiveFog,
      sensitivityLight: resolveSymptomFlag(
        levels.sensitivityLight,
        merged.sensitivityLight ?? existingSignal?.sensitivityLight,
      ),
      sensitivityLightLevel: levels.sensitivityLight,
      sensitivityNoise: resolveSymptomFlag(
        levels.sensitivityNoise,
        merged.sensitivityNoise ?? existingSignal?.sensitivityNoise,
      ),
      sensitivityNoiseLevel: levels.sensitivityNoise,
      digestiveIssues: resolveSymptomFlag(
        levels.digestiveIssues,
        merged.digestiveIssues ?? existingSignal?.digestiveIssues,
      ),
      digestiveIssuesLevel: levels.digestiveIssues,
      headache: resolveSymptomFlag(
        levels.headache,
        merged.headache ?? existingSignal?.headache,
      ),
      headacheLevel: levels.headache,
      anxiety: resolveSymptomFlag(
        levels.anxiety,
        merged.anxiety ?? existingSignal?.anxiety,
      ),
      anxietyLevel: levels.anxiety,
      depression: resolveSymptomFlag(
        levels.depression,
        merged.depression ?? existingSignal?.depression,
      ),
      depressionLevel: levels.depression,
      bodyTemperatureFeeling:
        merged.bodyTemperatureFeeling !== undefined
          ? (this.cleanDisplayText(merged.bodyTemperatureFeeling) ?? null)
          : (existingSignal?.bodyTemperatureFeeling ?? null),
      notes:
        merged.notes !== undefined
          ? (this.cleanDisplayText(merged.notes) ?? null)
          : (existingSignal?.notes ?? null),
    };
  }

  private resolveSymptomEntries(
    explicitEntries: SymptomEntryInputDto[] | undefined,
    symptomSignal: ResolvedSymptomSignalInput,
    existingRecord?: DailyRecordDetails,
  ): ResolvedSymptomEntryInput[] {
    const mergedEntries = new Map<string, ResolvedSymptomEntryInput>();

    for (const entry of this.buildSymptomEntriesFromSignal(symptomSignal)) {
      mergedEntries.set(normalizeText(entry.symptomName), entry);
    }

    for (const entry of explicitEntries ?? []) {
      const symptomName = this.cleanDisplayText(entry.symptomName);

      if (!entry.symptomId && !symptomName) {
        continue;
      }

      const normalizedKey = entry.symptomId ?? normalizeText(symptomName);

      if (!normalizedKey || entry.severity <= 0) {
        continue;
      }

      const inferredCategory =
        (symptomName
          ? CATEGORY_BY_NAME.get(normalizeText(symptomName))
          : undefined) ??
        entry.category ??
        SymptomCategory.OTHER;

      mergedEntries.set(normalizedKey, {
        symptomId: entry.symptomId,
        symptomName: symptomName ?? 'Sintoma adicional',
        category: inferredCategory,
        severity: Math.min(Math.max(Math.round(entry.severity), 0), 10),
        durationMinutes: entry.durationMinutes ?? null,
        notes: this.cleanDisplayText(entry.notes) ?? null,
      });
    }

    if (mergedEntries.size === 0 && existingRecord?.symptomEntries.length) {
      for (const entry of existingRecord.symptomEntries) {
        const normalizedKey = normalizeText(entry.symptom.name);

        if (!normalizedKey) {
          continue;
        }

        mergedEntries.set(normalizedKey, {
          symptomId: entry.symptomId,
          symptomName: entry.symptom.name,
          category:
            CATEGORY_BY_NAME.get(normalizeText(entry.symptom.name)) ??
            SymptomCategory.OTHER,
          severity: entry.severity,
          durationMinutes: entry.durationMinutes ?? null,
          notes: entry.notes ?? null,
        });
      }
    }

    return [...mergedEntries.values()]
      .filter((entry) => entry.severity > 0)
      .sort((left, right) => right.severity - left.severity);
  }

  private buildSymptomEntriesFromSignal(
    symptomSignal: ResolvedSymptomSignalInput,
  ): ResolvedSymptomEntryInput[] {
    const levels = [
      { key: 'cognitiveFog', severity: symptomSignal.cognitiveFogLevel },
      { key: 'headache', severity: symptomSignal.headacheLevel },
      { key: 'digestiveIssues', severity: symptomSignal.digestiveIssuesLevel },
      { key: 'anxiety', severity: symptomSignal.anxietyLevel },
      { key: 'depression', severity: symptomSignal.depressionLevel },
      {
        key: 'sensitivityLight',
        severity: symptomSignal.sensitivityLightLevel,
      },
      {
        key: 'sensitivityNoise',
        severity: symptomSignal.sensitivityNoiseLevel,
      },
      { key: 'stiffness', severity: symptomSignal.stiffness },
    ] as const;

    return levels.flatMap((entry) => {
      if (!entry.severity || entry.severity <= 0) {
        return [];
      }

      const definition = symptomCatalogDefinitions.find(
        (item) => item.key === entry.key || item.levelKey === entry.key,
      );
      const symptomName =
        NAME_BY_KEY.get(entry.key) ??
        (entry.key === 'stiffness' ? 'Rigidez corporal' : null);

      return [
        {
          symptomName: symptomName ?? definition?.label ?? 'Sintoma clinico',
          category: definition?.category ?? SymptomCategory.OTHER,
          severity: entry.severity,
          durationMinutes: null,
          notes: null,
        },
      ];
    });
  }

  private async createLinkedSymptomSignal(
    tx: Prisma.TransactionClient,
    userId: string,
    dailyRecordId: string,
    symptomSignal: ResolvedSymptomSignalInput,
  ): Promise<void> {
    await tx.symptomSignal.create({
      data: {
        userId,
        dailyRecordId,
        fatigueLevel: symptomSignal.fatigueLevel,
        sleepQuality: symptomSignal.sleepQuality,
        stiffness: symptomSignal.stiffness,
        mood: symptomSignal.mood,
        stress: symptomSignal.stress,
        cognitiveFog: symptomSignal.cognitiveFog,
        cognitiveFogLevel: symptomSignal.cognitiveFogLevel,
        sensitivityLight: symptomSignal.sensitivityLight,
        sensitivityLightLevel: symptomSignal.sensitivityLightLevel,
        sensitivityNoise: symptomSignal.sensitivityNoise,
        sensitivityNoiseLevel: symptomSignal.sensitivityNoiseLevel,
        digestiveIssues: symptomSignal.digestiveIssues,
        digestiveIssuesLevel: symptomSignal.digestiveIssuesLevel,
        headache: symptomSignal.headache,
        headacheLevel: symptomSignal.headacheLevel,
        anxiety: symptomSignal.anxiety,
        anxietyLevel: symptomSignal.anxietyLevel,
        depression: symptomSignal.depression,
        depressionLevel: symptomSignal.depressionLevel,
        bodyTemperatureFeeling: symptomSignal.bodyTemperatureFeeling,
        notes: symptomSignal.notes,
      },
    });
  }

  private async replaceLinkedSymptomSignal(
    tx: Prisma.TransactionClient,
    userId: string,
    dailyRecordId: string,
    symptomSignal: ResolvedSymptomSignalInput,
  ): Promise<void> {
    await tx.symptomSignal.deleteMany({
      where: {
        dailyRecordId,
      },
    });

    await this.createLinkedSymptomSignal(
      tx,
      userId,
      dailyRecordId,
      symptomSignal,
    );
  }

  private async replaceSymptomEntries(
    tx: Prisma.TransactionClient,
    dailyRecordId: string,
    entries: ResolvedSymptomEntryInput[],
  ): Promise<void> {
    await tx.symptomEntry.deleteMany({
      where: {
        dailyRecordId,
      },
    });

    if (entries.length === 0) {
      return;
    }

    const rows: Prisma.SymptomEntryCreateManyInput[] = [];

    for (const entry of entries) {
      const symptomId = await this.resolveSymptomId(tx, entry);

      rows.push({
        dailyRecordId,
        symptomId,
        severity: entry.severity,
        durationMinutes: entry.durationMinutes ?? null,
        notes: entry.notes ?? null,
      });
    }

    if (rows.length > 0) {
      await tx.symptomEntry.createMany({
        data: rows,
      });
    }
  }

  private async resolveSymptomId(
    tx: Prisma.TransactionClient,
    entry: ResolvedSymptomEntryInput,
  ): Promise<string> {
    if (entry.symptomId) {
      const existing = await tx.symptom.findUnique({
        where: {
          id: entry.symptomId,
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        return existing.id;
      }
    }

    const symptomName = entry.symptomName.trim();
    const slug = slugify(symptomName);

    const symptom = await tx.symptom.upsert({
      where: {
        slug,
      },
      update: {
        name: symptomName,
        category: entry.category,
        isActive: true,
      },
      create: {
        name: symptomName,
        slug,
        category: entry.category,
        isCore: false,
      },
      select: {
        id: true,
      },
    });

    return symptom.id;
  }

  private async persistWeatherSnapshot(
    tx: Prisma.TransactionClient,
    userId: string,
    weatherSnapshot: WeatherSnapshot | null,
  ): Promise<void> {
    if (!weatherSnapshot) {
      return;
    }

    const latestRecord = await tx.weatherRecord.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (
      latestRecord &&
      latestRecord.temperature === weatherSnapshot.temperature &&
      latestRecord.humidity === weatherSnapshot.humidity &&
      latestRecord.apparentTemperature ===
        weatherSnapshot.apparentTemperature &&
      latestRecord.precipitation === weatherSnapshot.precipitation &&
      latestRecord.pressure === weatherSnapshot.pressure &&
      latestRecord.windSpeed === weatherSnapshot.windSpeed &&
      latestRecord.weatherCode === weatherSnapshot.weatherCode
    ) {
      return;
    }

    await tx.weatherRecord.create({
      data: {
        userId,
        temperature: weatherSnapshot.temperature,
        humidity: weatherSnapshot.humidity,
        apparentTemperature: weatherSnapshot.apparentTemperature,
        precipitation: weatherSnapshot.precipitation,
        pressure: weatherSnapshot.pressure,
        windSpeed: weatherSnapshot.windSpeed,
        weatherCode: weatherSnapshot.weatherCode,
        createdAt: weatherSnapshot.fetchedAt
          ? new Date(weatherSnapshot.fetchedAt)
          : undefined,
      },
    });
  }

  private inferPainLevel(
    fatigueLevel: number,
    stressLevel: number,
    mood: number,
  ): number {
    const inferred = Math.round((fatigueLevel + stressLevel + (10 - mood)) / 3);
    return Math.min(Math.max(inferred, 0), 10);
  }

  private normalizeStringArray(values?: string[] | null): string[] {
    if (!values || values.length === 0) {
      return [];
    }

    const uniqueValues = new Map<string, string>();

    for (const rawValue of values) {
      const cleanedValue = this.cleanDisplayText(rawValue);
      const normalizedValue = normalizeText(cleanedValue);

      if (
        !cleanedValue ||
        !normalizedValue ||
        uniqueValues.has(normalizedValue)
      ) {
        continue;
      }

      uniqueValues.set(normalizedValue, cleanedValue);
    }

    return [...uniqueValues.values()];
  }

  private cleanDisplayText(value?: string | null): string | undefined {
    const trimmed = value?.trim().replace(/\s+/g, ' ');
    return trimmed ? trimmed : undefined;
  }

  private resolveRequiredNumber(
    field: string,
    value?: number | null,
    fallback?: number | null,
  ): number {
    const resolvedValue =
      value !== undefined && value !== null ? Number(value) : fallback;

    if (resolvedValue === undefined || resolvedValue === null) {
      throw new BadRequestException(
        `${field} is required for the multidimensional pain record.`,
      );
    }

    return Math.min(Math.max(Math.round(resolvedValue), 0), 10);
  }

  private resolveOptionalNumber(
    value?: number | null,
    fallback?: number | null,
    allowDecimal = false,
  ): number | null {
    const resolvedValue =
      value !== undefined && value !== null ? Number(value) : fallback;

    if (resolvedValue === undefined || resolvedValue === null) {
      return null;
    }

    if (allowDecimal) {
      return Number(resolvedValue.toFixed(2));
    }

    return Math.max(Math.round(resolvedValue), 0);
  }

  private combinePainAreas(partitions: PainAreaPartitions): string[] {
    return this.normalizeStringArray([
      ...partitions.frontPainAreas,
      ...partitions.backPainAreas,
    ]);
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

  private buildRecordMetadata(
    metadata: Prisma.JsonValue | null | undefined,
    record: Pick<
      ResolvedRecordInput,
      'weatherSnapshot' | 'frontPainAreas' | 'backPainAreas'
    >,
  ): Prisma.InputJsonValue | undefined {
    const withWeather = buildWeatherMetadata(metadata, record.weatherSnapshot);
    const base =
      withWeather &&
      typeof withWeather === 'object' &&
      !Array.isArray(withWeather)
        ? { ...(withWeather as Record<string, unknown>) }
        : {};

    base.frontPainAreas = record.frontPainAreas;
    base.backPainAreas = record.backPainAreas;

    return Object.keys(base).length > 0
      ? (base as Prisma.InputJsonValue)
      : undefined;
  }

  private parsePainAreaPartitions(
    metadata: Prisma.JsonValue | null | undefined,
  ): PainAreaPartitions {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {
        frontPainAreas: [],
        backPainAreas: [],
      };
    }

    const candidate = metadata as Record<string, unknown>;

    return {
      frontPainAreas: this.normalizeStringArray(
        Array.isArray(candidate.frontPainAreas)
          ? candidate.frontPainAreas.filter(
              (value): value is string => typeof value === 'string',
            )
          : [],
      ),
      backPainAreas: this.normalizeStringArray(
        Array.isArray(candidate.backPainAreas)
          ? candidate.backPainAreas.filter(
              (value): value is string => typeof value === 'string',
            )
          : [],
      ),
    };
  }

  private mapRecord(record: DailyRecordDetails): {
    id: string;
    recordDate: string;
    painLevel: number;
    sleepHours: number | null;
    sleepQuality: number | null;
    fatigueLevel: number;
    mood: number;
    moodLevel: number;
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
    frontPainAreas: string[];
    backPainAreas: string[];
    painTriggers: string[];
    derivedSignals: boolean;
    dataReliabilityScore: number;
    dataReliabilityLabel: string;
    symptomSignal: ResolvedSymptomSignalInput | null;
    symptomEntries: Array<{
      id: string;
      symptomId: string;
      symptomName: string;
      severity: number;
      durationMinutes: number | null;
      notes: string | null;
    }>;
    createdAt: Date;
    updatedAt: Date;
  } {
    const weatherSnapshot = parseWeatherSnapshotFromMetadata(record.metadata);
    const partitions = this.parsePainAreaPartitions(record.metadata);
    const symptomSignalRow = record.symptomSignals[0] ?? null;
    const symptomEntries = record.symptomEntries.map((entry) => ({
      id: entry.id,
      symptomId: entry.symptomId,
      symptomName: entry.symptom.name,
      severity: entry.severity,
      durationMinutes: entry.durationMinutes ?? null,
      notes: entry.notes ?? null,
    }));
    const reliability = calculateDataReliability({
      recordDate: record.recordDate,
      createdAt: record.createdAt,
      painLevel: record.painLevel,
      fatigueLevel: record.fatigueLevel,
      stressLevel: record.stressLevel,
      moodLevel: record.moodLevel,
      sleepQuality: record.sleepQuality,
      sleepHours: record.sleepHours,
      hydration: record.waterIntakeLiters,
      physicalActivity: record.exerciseMinutes,
      medicationTaken: record.medicationAdherence,
      weatherFeeling: record.weatherFeeling,
      notes: record.notes,
      painType: record.painType,
      painAreas: record.painAreas,
      painTriggers: record.painTriggers,
      symptomSignalPresent: symptomSignalRow !== null,
      symptomEntryCount: symptomEntries.length,
      derivedSignals: record.derivedSignals,
    });

    return {
      id: record.id,
      recordDate: this.formatDateOnly(record.recordDate),
      painLevel: record.painLevel,
      sleepHours: record.sleepHours,
      sleepQuality: record.sleepQuality,
      fatigueLevel: record.fatigueLevel,
      mood: record.moodLevel,
      moodLevel: record.moodLevel,
      stressLevel: record.stressLevel,
      physicalActivity: record.exerciseMinutes,
      medicationTaken: record.medicationAdherence,
      hydration: record.waterIntakeLiters,
      weatherFeeling: record.weatherFeeling,
      weatherImpact: record.weatherFeeling,
      weatherSnapshot,
      notes: record.notes,
      painType: record.painType,
      painAreas: record.painAreas,
      frontPainAreas: partitions.frontPainAreas,
      backPainAreas: partitions.backPainAreas,
      painTriggers: record.painTriggers,
      derivedSignals: record.derivedSignals,
      dataReliabilityScore: reliability.score,
      dataReliabilityLabel: reliability.label,
      symptomSignal: symptomSignalRow
        ? {
            fatigueLevel: symptomSignalRow.fatigueLevel,
            sleepQuality: symptomSignalRow.sleepQuality,
            stiffness: symptomSignalRow.stiffness,
            mood: symptomSignalRow.mood,
            stress: symptomSignalRow.stress,
            cognitiveFog: symptomSignalRow.cognitiveFog,
            cognitiveFogLevel: symptomSignalRow.cognitiveFogLevel,
            sensitivityLight: symptomSignalRow.sensitivityLight,
            sensitivityLightLevel: symptomSignalRow.sensitivityLightLevel,
            sensitivityNoise: symptomSignalRow.sensitivityNoise,
            sensitivityNoiseLevel: symptomSignalRow.sensitivityNoiseLevel,
            digestiveIssues: symptomSignalRow.digestiveIssues,
            digestiveIssuesLevel: symptomSignalRow.digestiveIssuesLevel,
            headache: symptomSignalRow.headache,
            headacheLevel: symptomSignalRow.headacheLevel,
            anxiety: symptomSignalRow.anxiety,
            anxietyLevel: symptomSignalRow.anxietyLevel,
            depression: symptomSignalRow.depression,
            depressionLevel: symptomSignalRow.depressionLevel,
            bodyTemperatureFeeling: symptomSignalRow.bodyTemperatureFeeling,
            notes: symptomSignalRow.notes,
          }
        : null,
      symptomEntries,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private formatDateOnly(date: Date): string {
    return normalizeDateOnly(date).toISOString().slice(0, 10);
  }
}
