import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PredictionSource,
  RiskLevel,
  type DailyRecord,
  type Prisma,
} from '@prisma/client';
import { addDays, normalizeDateOnly } from '@/common/utils/date.util';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import { PrismaService } from '@/database/prisma.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';

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
    } = this.calculateRisk(record);

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
      symptomEntries: Array<{ severity: number; symptom: { name: string } }>;
    },
  ): {
    probability: number;
    riskLevel: RiskLevel;
    confidenceScore: number;
    factors: RiskFactor[];
    recommendationSummary: string;
  } {
    const averageSymptomSeverity =
      record.symptomEntries.length > 0
        ? record.symptomEntries.reduce((sum, item) => sum + item.severity, 0) /
          record.symptomEntries.length
        : 0;
    const sleepPenalty =
      record.sleepHours !== null && record.sleepHours !== undefined
        ? Math.max(0, ((7 - record.sleepHours) / 7) * 15)
        : 5;
    const hydrationPenalty =
      record.waterIntakeLiters !== null &&
      record.waterIntakeLiters !== undefined
        ? Math.max(0, ((2 - record.waterIntakeLiters) / 2) * 5)
        : 2;

    const factors: RiskFactor[] = [
      {
        key: 'pain',
        label: 'Pain burden',
        value: record.painLevel,
        contribution: (record.painLevel / 10) * 25,
      },
      {
        key: 'fatigue',
        label: 'Fatigue level',
        value: record.fatigueLevel,
        contribution: (record.fatigueLevel / 10) * 20,
      },
      {
        key: 'stress',
        label: 'Stress load',
        value: record.stressLevel,
        contribution: (record.stressLevel / 10) * 15,
      },
      {
        key: 'sleep',
        label: 'Sleep deficit',
        value: Number(record.sleepHours ?? 0),
        contribution: sleepPenalty,
      },
      {
        key: 'mood',
        label: 'Mood instability',
        value: 10 - record.moodLevel,
        contribution: ((10 - record.moodLevel) / 10) * 10,
      },
      {
        key: 'symptom-burden',
        label: 'Symptom burden',
        value: averageSymptomSeverity,
        contribution: (averageSymptomSeverity / 10) * 15,
      },
      {
        key: 'hydration',
        label: 'Hydration deficit',
        value: Number(record.waterIntakeLiters ?? 0),
        contribution: hydrationPenalty,
      },
    ];

    const score = Math.min(
      factors.reduce((sum, factor) => sum + factor.contribution, 0),
      100,
    );
    const probability = Number((score / 100).toFixed(4));
    const filledSignals = [
      record.sleepHours,
      record.sleepQuality,
      record.exerciseMinutes,
      record.waterIntakeLiters,
      record.medicationAdherence,
      record.notes,
      record.symptomEntries.length > 0 ? 1 : null,
    ].filter((value) => value !== null && value !== undefined).length;
    const confidenceScore = Number(
      Math.min(0.7 + filledSignals * 0.04, 0.98).toFixed(4),
    );

    let riskLevel: RiskLevel = RiskLevel.LOW;
    if (probability >= 0.8) {
      riskLevel = RiskLevel.CRITICAL;
    } else if (probability >= 0.6) {
      riskLevel = RiskLevel.HIGH;
    } else if (probability >= 0.35) {
      riskLevel = RiskLevel.MODERATE;
    }

    const recommendationSummary =
      riskLevel === RiskLevel.CRITICAL
        ? 'Critical flare risk detected. Consider reducing workload, prioritizing rest and contacting your care team.'
        : riskLevel === RiskLevel.HIGH
          ? 'High flare risk detected. Increase self-care, hydration and rest while monitoring symptoms closely.'
          : riskLevel === RiskLevel.MODERATE
            ? 'Moderate flare risk detected. Keep a stable routine and watch pain, stress and sleep closely.'
            : 'Low flare risk detected. Maintain the current care routine and continue tracking consistently.';

    return {
      probability,
      riskLevel,
      confidenceScore,
      factors,
      recommendationSummary,
    };
  }
}
