import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PredictionSource,
  RiskLevel,
  type DailyRecord,
  type Prisma,
} from '@prisma/client';
import { calculateDataReliability } from '@/common/utils/data-reliability.util';
import { addDays, normalizeDateOnly } from '@/common/utils/date.util';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import { averageSymptomBurden } from '@/common/utils/symptom-signal.util';
import { PrismaService } from '@/database/prisma.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { WeatherService } from '@/modules/weather/weather.service';
import {
  parseWeatherSnapshotFromMetadata,
  type WeatherSnapshot,
} from '@/modules/weather/weather.types';

interface RiskFactor {
  key: string;
  label: string;
  value: number;
  contribution: number;
}

@Injectable()
export class CrisisPredictionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly weatherService: WeatherService,
  ) {}

  async upsertForDailyRecord(
    userId: string,
    dailyRecordId: string,
  ): Promise<unknown> {
    const record = await this.prisma.dailyRecord.findFirst({
      where: {
        id: dailyRecordId,
        userId,
      },
      include: {
        symptomSignals: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        symptomEntries: {
          include: {
            symptom: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Daily record not found for prediction.');
    }

    const {
      probability,
      riskLevel,
      confidenceScore,
      factors,
      recommendationSummary,
    } = this.calculateRisk(
      record,
      parseWeatherSnapshotFromMetadata(record.metadata) ??
        (await this.weatherService.findLatestSnapshotForUserDate(
          userId,
          record.recordDate,
        )),
    );

    const prediction = await this.prisma.crisisPrediction.upsert({
      where: {
        dailyRecordId: record.id,
      },
      update: {
        predictedFor: addDays(normalizeDateOnly(record.recordDate), 1),
        probability,
        riskLevel,
        confidenceScore,
        riskFactors: factors as unknown as Prisma.InputJsonValue,
        recommendationSummary,
        source: PredictionSource.RULE_ENGINE,
      },
      create: {
        userId,
        dailyRecordId: record.id,
        predictedFor: addDays(normalizeDateOnly(record.recordDate), 1),
        probability,
        riskLevel,
        confidenceScore,
        riskFactors: factors as unknown as Prisma.InputJsonValue,
        recommendationSummary,
        source: PredictionSource.RULE_ENGINE,
      },
      include: {
        dailyRecord: {
          include: {
            symptomEntries: {
              include: {
                symptom: true,
              },
            },
          },
        },
      },
    });

    await this.notificationsService.createOrRefreshCrisisAlert(prediction);

    return prediction;
  }

  async getLatestForUser(userId: string): Promise<unknown> {
    const prediction = await this.prisma.crisisPrediction.findFirst({
      where: {
        userId,
      },
      include: {
        dailyRecord: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!prediction) {
      throw new NotFoundException('No crisis predictions found for this user.');
    }

    return prediction;
  }

  async getHistoryForUser(
    userId: string,
    query: {
      riskLevel?: RiskLevel;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    items: unknown[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where: Prisma.CrisisPredictionWhereInput = {
      userId,
      riskLevel: query.riskLevel,
      ...(query.dateFrom || query.dateTo
        ? {
            predictedFor: {
              gte: query.dateFrom
                ? normalizeDateOnly(query.dateFrom)
                : undefined,
              lte: query.dateTo ? normalizeDateOnly(query.dateTo) : undefined,
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.crisisPrediction.findMany({
        where,
        include: {
          dailyRecord: true,
          notifications: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 3,
          },
        },
        orderBy: {
          predictedFor: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.crisisPrediction.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async recalculate(userId: string, dailyRecordId: string): Promise<unknown> {
    return this.upsertForDailyRecord(userId, dailyRecordId);
  }

  private calculateRisk(
    record: DailyRecord & {
      symptomSignals: Array<{
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
      }>;
      symptomEntries: Array<{ severity: number; symptom: { name: string } }>;
    },
    weatherSnapshot: WeatherSnapshot | null,
  ): {
    probability: number;
    riskLevel: RiskLevel;
    confidenceScore: number;
    factors: RiskFactor[];
    recommendationSummary: string;
  } {
    const symptomBurden = this.resolveSymptomBurden(record);
    const sleepContribution = this.buildSleepContribution(record);
    const moodContribution = this.buildMoodContribution(record);
    const hydrationContribution = this.buildHydrationContribution(record);
    const weatherContribution = this.buildWeatherContribution(weatherSnapshot);

    const factors: RiskFactor[] = [
      {
        key: 'pain',
        label: 'Dor',
        value: record.painLevel,
        contribution: (record.painLevel / 10) * 25,
      },
      {
        key: 'fatigue',
        label: 'Fadiga',
        value: record.fatigueLevel,
        contribution: (record.fatigueLevel / 10) * 20,
      },
      {
        key: 'sleep',
        label: 'Sono',
        value: Number(record.sleepQuality ?? 0),
        contribution: sleepContribution,
      },
      {
        key: 'stress',
        label: 'Estresse',
        value: record.stressLevel,
        contribution: (record.stressLevel / 10) * 15,
      },
      {
        key: 'mood',
        label: 'Humor',
        value: record.moodLevel,
        contribution: moodContribution,
      },
      {
        key: 'symptoms',
        label: 'Carga de sintomas',
        value: symptomBurden,
        contribution: (symptomBurden / 10) * 15,
      },
      {
        key: 'weather',
        label: 'Clima',
        value: weatherContribution,
        contribution: weatherContribution,
      },
      {
        key: 'hydration',
        label: 'Hidratacao',
        value: Number(record.waterIntakeLiters ?? 0),
        contribution: hydrationContribution,
      },
    ];

    const maximumScore = 120;
    const score = Math.min(
      factors.reduce((sum, factor) => sum + factor.contribution, 0),
      maximumScore,
    );
    const probability = Number((score / maximumScore).toFixed(4));
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
      symptomSignalPresent: record.symptomSignals.length > 0,
      symptomEntryCount: record.symptomEntries.length,
      derivedSignals: record.derivedSignals,
    });
    const confidenceScore = Number(
      Math.min(Math.max(reliability.score / 100, 0.45), 0.98).toFixed(4),
    );

    let riskLevel: RiskLevel = RiskLevel.LOW;
    if (probability >= 0.85) {
      riskLevel = RiskLevel.CRITICAL;
    } else if (probability >= 0.65) {
      riskLevel = RiskLevel.HIGH;
    } else if (probability >= 0.4) {
      riskLevel = RiskLevel.MODERATE;
    }

    const baseRecommendation =
      riskLevel === RiskLevel.CRITICAL
        ? 'Risco critico de crise detectado. Reduza a carga do dia, priorize descanso e considere acionar sua equipe de cuidado.'
        : riskLevel === RiskLevel.HIGH
          ? 'Risco alto de crise detectado. Reforce autocuidado, hidratacao e pausas, acompanhando os sintomas mais de perto.'
          : riskLevel === RiskLevel.MODERATE
            ? 'Risco moderado de crise detectado. Mantenha uma rotina estavel e observe dor, estresse e sono ao longo do dia.'
            : 'Risco baixo de crise detectado. Mantenha a rotina atual e continue registrando com consistencia.';
    const weatherRecommendation =
      this.buildWeatherRecommendation(weatherSnapshot);
    const recommendationSummary = weatherRecommendation
      ? `${baseRecommendation} ${weatherRecommendation}`
      : baseRecommendation;

    return {
      probability,
      riskLevel,
      confidenceScore,
      factors,
      recommendationSummary,
    };
  }

  private resolveSymptomBurden(
    record: DailyRecord & {
      symptomSignals: Array<{
        stiffness: number;
        cognitiveFogLevel: number | null;
        sensitivityLightLevel: number | null;
        sensitivityNoiseLevel: number | null;
        digestiveIssuesLevel: number | null;
        headacheLevel: number | null;
        anxietyLevel: number | null;
        depressionLevel: number | null;
      }>;
      symptomEntries: Array<{ severity: number }>;
    },
  ): number {
    const latestSignal = record.symptomSignals[0];

    if (latestSignal) {
      return averageSymptomBurden([
        latestSignal.stiffness,
        latestSignal.cognitiveFogLevel,
        latestSignal.sensitivityLightLevel,
        latestSignal.sensitivityNoiseLevel,
        latestSignal.digestiveIssuesLevel,
        latestSignal.headacheLevel,
        latestSignal.anxietyLevel,
        latestSignal.depressionLevel,
      ]);
    }

    return record.symptomEntries.length > 0
      ? record.symptomEntries.reduce((sum, entry) => sum + entry.severity, 0) /
          record.symptomEntries.length
      : 0;
  }

  private buildSleepContribution(record: DailyRecord): number {
    const sleepQualityContribution =
      record.sleepQuality !== null && record.sleepQuality !== undefined
        ? ((10 - record.sleepQuality) / 10) * 12
        : 0;
    const sleepPenalty =
      record.sleepHours !== null && record.sleepHours !== undefined
        ? record.sleepHours < 5
          ? 15
          : record.sleepHours < 7
            ? 8
            : 0
        : 0;

    return Number(
      Math.min(sleepQualityContribution + sleepPenalty, 20).toFixed(2),
    );
  }

  private buildMoodContribution(record: DailyRecord): number {
    const moodPenalty =
      record.moodLevel <= 3 ? 10 : record.moodLevel <= 5 ? 5 : 0;
    const moodTrendContribution = ((10 - record.moodLevel) / 10) * 4;

    return Number(
      Math.min(Math.max(moodPenalty + moodTrendContribution, 0), 10).toFixed(2),
    );
  }

  private buildHydrationContribution(record: DailyRecord): number {
    if (
      record.waterIntakeLiters === null ||
      record.waterIntakeLiters === undefined
    ) {
      return 0;
    }

    if (record.waterIntakeLiters < 1) {
      return 5;
    }

    if (record.waterIntakeLiters < 1.5) {
      return 4;
    }

    if (record.waterIntakeLiters < 2) {
      return 2;
    }

    return 0;
  }

  private buildWeatherContribution(
    weatherSnapshot: WeatherSnapshot | null,
  ): number {
    if (!weatherSnapshot) {
      return 0;
    }

    let contribution = 0;

    if (
      weatherSnapshot.temperature < 18 ||
      weatherSnapshot.apparentTemperature < 17
    ) {
      contribution += 3;
    } else if (
      weatherSnapshot.temperature > 32 ||
      weatherSnapshot.apparentTemperature > 34
    ) {
      contribution += 2;
    }

    if (weatherSnapshot.humidity >= 75) {
      contribution += 2;
    }

    if (weatherSnapshot.pressure < 1000) {
      contribution += 3;
    }

    if (weatherSnapshot.precipitation > 0) {
      contribution += weatherSnapshot.precipitation >= 5 ? 2 : 1;
    }

    return Math.min(contribution, 10);
  }

  private buildWeatherRecommendation(
    weatherSnapshot: WeatherSnapshot | null,
  ): string | null {
    if (!weatherSnapshot) {
      return null;
    }

    const notes: string[] = [];

    if (weatherSnapshot.temperature < 20 && weatherSnapshot.humidity > 70) {
      notes.push(
        'Frio com umidade alta pode intensificar rigidez e sensacao corporal pesada.',
      );
    }

    if (weatherSnapshot.pressure < 1000) {
      notes.push(
        'Queda de pressao atmosferica pode aumentar sensibilidade a dor.',
      );
    }

    if (weatherSnapshot.precipitation > 0) {
      notes.push(
        'Chuva pode contribuir para mais fadiga ou sensacao de corpo pesado.',
      );
    }

    return notes.length > 0 ? `Clima de hoje: ${notes.join(' ')}` : null;
  }
}
