import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ReportStatus,
  ReportType,
  type AiPredictionRiskLevel,
  type Prisma,
  type RiskLevel,
} from '@prisma/client';
import { addDays, normalizeDateOnly } from '@/common/utils/date.util';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import { PrismaService } from '@/database/prisma.service';
import type { GenerateReportDto } from './dto/generate-report.dto';
import type { ReportListResponseDto } from './dto/report-list-response.dto';
import type {
  ReportResponseDto,
  ReportStructuredDataDto,
} from './dto/report-response.dto';
import type { ReportQueryDto } from './dto/report-query.dto';
import { ReportPeriod } from './enums/report-period.enum';
import { reportResponseSelect, type ReportDetails } from './reports.select';

const reportDailyRecordSelect = {
  recordDate: true,
  sleepHours: true,
  sleepQuality: true,
  fatigueLevel: true,
  moodLevel: true,
  stressLevel: true,
  exerciseMinutes: true,
  waterIntakeLiters: true,
  medicationAdherence: true,
  weatherFeeling: true,
  crisisPrediction: {
    select: {
      probability: true,
      riskLevel: true,
    },
  },
} satisfies Prisma.DailyRecordSelect;

const reportSymptomSignalSelect = {
  createdAt: true,
  cognitiveFog: true,
  sensitivityLight: true,
  sensitivityNoise: true,
  digestiveIssues: true,
  headache: true,
  anxiety: true,
  depression: true,
  bodyTemperatureFeeling: true,
} satisfies Prisma.SymptomSignalSelect;

const reportAiPredictionSelect = {
  probabilityScore: true,
  riskLevel: true,
  createdAt: true,
  dailyRecord: {
    select: {
      recordDate: true,
    },
  },
} satisfies Prisma.AiPredictionSelect;

const reportUserRiskProfileSelect = {
  currentPersonalizedScore: true,
  baselineScore: true,
  summary: true,
  triggerPatterns: true,
  personalizedWeights: true,
  lastAnalyzedAt: true,
} satisfies Prisma.UserRiskProfileSelect;

type ReportDailyRecordRow = Prisma.DailyRecordGetPayload<{
  select: typeof reportDailyRecordSelect;
}>;

type ReportSymptomSignalRow = Prisma.SymptomSignalGetPayload<{
  select: typeof reportSymptomSignalSelect;
}>;

type ReportAiPredictionRow = Prisma.AiPredictionGetPayload<{
  select: typeof reportAiPredictionSelect;
}>;

type ReportUserRiskProfileRow = Prisma.UserRiskProfileGetPayload<{
  select: typeof reportUserRiskProfileSelect;
}>;

interface ReportDaySnapshot {
  date: Date;
  sleepHours: number | null;
  sleepQuality: number | null;
  fatigueLevel: number | null;
  moodLevel: number | null;
  stressLevel: number | null;
  physicalActivity: number | null;
  hydration: number | null;
  medicationTaken: boolean | null;
  weatherFeeling: string | null;
  ruleBasedProbabilityScore: number | null;
  ruleBasedRiskLevel: RiskLevel | null;
  aiProbabilityScore: number | null;
  aiRiskLevel: AiPredictionRiskLevel | null;
  cognitiveFog: boolean;
  sensitivityLight: boolean;
  sensitivityNoise: boolean;
  digestiveIssues: boolean;
  headache: boolean;
  anxiety: boolean;
  depression: boolean;
  coldBodyTemperature: boolean;
  signalCount: number;
}

interface TriggerPatternSnapshot {
  key: string;
  label: string;
  description: string;
  occurrenceRateBeforeCrisis: number;
  evidenceCount: number;
  strength: 'MEDIUM' | 'HIGH';
}

interface PersonalizedWeightSnapshot {
  key: string;
  label: string;
  personalizedWeight: number;
  evidenceCount: number;
  lift: number;
  activeOnLatestDay: boolean;
}

interface TriggerDefinition {
  key: string;
  label: string;
  source: string;
  matcher: (day: ReportDaySnapshot) => boolean;
}

interface CorrelationPairDefinition {
  key: string;
  leftMetric: string;
  rightMetric: string;
  left: (day: ReportDaySnapshot) => number | null;
  right: (day: ReportDaySnapshot) => number | null;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(
    userId: string,
    dto: GenerateReportDto,
  ): Promise<ReportResponseDto> {
    const period = dto.period ?? ReportPeriod.MONTHLY;
    const window = this.resolveWindow(period);

    const [dailyRecords, symptomSignals, aiPredictions, userRiskProfile] =
      await this.prisma.$transaction([
        this.prisma.dailyRecord.findMany({
          where: {
            userId,
            recordDate: {
              gte: window.periodStart,
              lte: window.periodEnd,
            },
          },
          select: reportDailyRecordSelect,
          orderBy: {
            recordDate: 'asc',
          },
        }),
        this.prisma.symptomSignal.findMany({
          where: {
            userId,
            createdAt: {
              gte: window.periodStart,
              lt: addDays(window.periodEnd, 1),
            },
          },
          select: reportSymptomSignalSelect,
          orderBy: {
            createdAt: 'asc',
          },
        }),
        this.prisma.aiPrediction.findMany({
          where: {
            userId,
            createdAt: {
              gte: window.periodStart,
              lt: addDays(window.periodEnd, 1),
            },
          },
          select: reportAiPredictionSelect,
          orderBy: {
            createdAt: 'asc',
          },
        }),
        this.prisma.userRiskProfile.findUnique({
          where: {
            userId,
          },
          select: reportUserRiskProfileSelect,
        }),
      ]);

    const structuredData = this.buildStructuredData(
      period,
      window.periodStart,
      window.periodEnd,
      window.expectedDays,
      dailyRecords,
      symptomSignals,
      aiPredictions,
      userRiskProfile,
    );

    const report = await this.prisma.report.upsert({
      where: {
        userId_type_periodStart_periodEnd: {
          userId,
          type: window.type,
          periodStart: window.periodStart,
          periodEnd: window.periodEnd,
        },
      },
      update: {
        status: ReportStatus.READY,
        summary: this.toJsonValue(structuredData),
        generatedAt: new Date(),
        fileUrl: null,
      },
      create: {
        userId,
        type: window.type,
        status: ReportStatus.READY,
        periodStart: window.periodStart,
        periodEnd: window.periodEnd,
        summary: this.toJsonValue(structuredData),
        generatedAt: new Date(),
        fileUrl: null,
      },
      select: reportResponseSelect,
    });

    return this.mapReport(report);
  }

  async listForUser(
    userId: string,
    query: ReportQueryDto,
  ): Promise<ReportListResponseDto> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where: Prisma.ReportWhereInput = {
      userId,
      status: query.status,
      type: query.period ? this.mapPeriodToType(query.period) : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        select: reportResponseSelect,
        orderBy: {
          generatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapReport(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findOneForUser(userId: string, id: string): Promise<ReportResponseDto> {
    const report = await this.prisma.report.findFirst({
      where: {
        id,
        userId,
      },
      select: reportResponseSelect,
    });

    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    return this.mapReport(report);
  }

  private resolveWindow(period: ReportPeriod): {
    periodStart: Date;
    periodEnd: Date;
    expectedDays: number;
    type: ReportType;
  } {
    const periodEnd = normalizeDateOnly(new Date());
    const expectedDays =
      period === ReportPeriod.WEEKLY
        ? 7
        : period === ReportPeriod.QUARTERLY
          ? 90
          : 30;

    return {
      periodStart: addDays(periodEnd, -(expectedDays - 1)),
      periodEnd,
      expectedDays,
      type: this.mapPeriodToType(period),
    };
  }

  private buildStructuredData(
    period: ReportPeriod,
    periodStart: Date,
    periodEnd: Date,
    expectedDays: number,
    dailyRecords: ReportDailyRecordRow[],
    symptomSignals: ReportSymptomSignalRow[],
    aiPredictions: ReportAiPredictionRow[],
    userRiskProfile: ReportUserRiskProfileRow | null,
  ): ReportStructuredDataDto {
    const daySnapshots = this.buildDaySnapshots(
      dailyRecords,
      symptomSignals,
      aiPredictions,
    );
    const activeDays = daySnapshots.length;

    return {
      metadata: {
        format: 'json',
        period,
        generatedAt: new Date(),
        window: {
          start: this.formatDateOnly(periodStart),
          end: this.formatDateOnly(periodEnd),
          expectedDays,
          capturedDays: activeDays,
        },
        pdfExport: {
          readyForFutureGeneration: true,
          generated: false,
          fileUrl: null,
        },
      },
      overview: {
        recordedDays: dailyRecords.length,
        symptomSignalCount: symptomSignals.length,
        rulePredictionCount: dailyRecords.filter(
          (record) => record.crisisPrediction !== null,
        ).length,
        aiPredictionCount: aiPredictions.length,
        dataCoverageRate: this.toFixedNumber(
          expectedDays > 0 ? (activeDays / expectedDays) * 100 : 0,
        ),
        averageSleepHours: this.average(
          dailyRecords
            .map((record) => record.sleepHours)
            .filter((value): value is number => value !== null),
        ),
        averageFatigueLevel: this.average(
          dailyRecords.map((record) => record.fatigueLevel),
        ),
        averageMoodLevel: this.average(
          dailyRecords.map((record) => record.moodLevel),
        ),
        averageStressLevel: this.average(
          dailyRecords.map((record) => record.stressLevel),
        ),
        averageProbabilityScore: this.average(
          daySnapshots
            .map((day) => this.resolveCombinedProbability(day))
            .filter((value): value is number => value !== null),
        ),
      },
      sleepEvolution: {
        hours: this.buildMetricEvolution(
          dailyRecords
            .map((record) =>
              record.sleepHours !== null
                ? {
                    date: this.formatDateOnly(record.recordDate),
                    value: record.sleepHours,
                  }
                : null,
            )
            .filter(
              (item): item is { date: string; value: number } => item !== null,
            ),
          true,
          0.35,
        ),
        quality: this.buildMetricEvolution(
          dailyRecords
            .map((record) =>
              record.sleepQuality !== null
                ? {
                    date: this.formatDateOnly(record.recordDate),
                    value: record.sleepQuality,
                  }
                : null,
            )
            .filter(
              (item): item is { date: string; value: number } => item !== null,
            ),
          true,
          0.4,
        ),
      },
      fatigueEvolution: this.buildMetricEvolution(
        dailyRecords.map((record) => ({
          date: this.formatDateOnly(record.recordDate),
          value: record.fatigueLevel,
        })),
        false,
        0.4,
      ),
      moodEvolution: this.buildMetricEvolution(
        dailyRecords.map((record) => ({
          date: this.formatDateOnly(record.recordDate),
          value: record.moodLevel,
        })),
        true,
        0.4,
      ),
      recurringTriggers: this.buildRecurringTriggers(daySnapshots),
      crisisProbability: this.buildCrisisProbability(daySnapshots),
      correlations: this.buildCorrelations(daySnapshots),
      personalizedRiskProfile:
        this.buildPersonalizedRiskProfile(userRiskProfile),
    };
  }

  private buildDaySnapshots(
    dailyRecords: ReportDailyRecordRow[],
    symptomSignals: ReportSymptomSignalRow[],
    aiPredictions: ReportAiPredictionRow[],
  ): ReportDaySnapshot[] {
    const dayMap = new Map<string, ReportDaySnapshot>();

    for (const record of dailyRecords) {
      const key = this.formatDateOnly(record.recordDate);
      const day = this.getOrCreateDay(dayMap, key, record.recordDate);

      day.sleepHours = record.sleepHours;
      day.sleepQuality = record.sleepQuality;
      day.fatigueLevel = record.fatigueLevel;
      day.moodLevel = record.moodLevel;
      day.stressLevel = record.stressLevel;
      day.physicalActivity = record.exerciseMinutes;
      day.hydration = record.waterIntakeLiters;
      day.medicationTaken = record.medicationAdherence;
      day.weatherFeeling = record.weatherFeeling;
      day.ruleBasedProbabilityScore =
        record.crisisPrediction !== null
          ? Math.round(record.crisisPrediction.probability * 100)
          : null;
      day.ruleBasedRiskLevel = record.crisisPrediction?.riskLevel ?? null;
    }

    for (const signal of symptomSignals) {
      const normalizedDate = normalizeDateOnly(signal.createdAt);
      const key = this.formatDateOnly(normalizedDate);
      const day = this.getOrCreateDay(dayMap, key, normalizedDate);

      day.signalCount += 1;
      day.cognitiveFog = day.cognitiveFog || signal.cognitiveFog;
      day.sensitivityLight = day.sensitivityLight || signal.sensitivityLight;
      day.sensitivityNoise = day.sensitivityNoise || signal.sensitivityNoise;
      day.digestiveIssues = day.digestiveIssues || signal.digestiveIssues;
      day.headache = day.headache || signal.headache;
      day.anxiety = day.anxiety || signal.anxiety;
      day.depression = day.depression || signal.depression;
      day.coldBodyTemperature =
        day.coldBodyTemperature ||
        this.isColdFeeling(signal.bodyTemperatureFeeling);
    }

    for (const prediction of aiPredictions) {
      const referenceDate =
        prediction.dailyRecord?.recordDate ??
        normalizeDateOnly(prediction.createdAt);
      const key = this.formatDateOnly(referenceDate);
      const day = this.getOrCreateDay(dayMap, key, referenceDate);

      if (
        day.aiProbabilityScore === null ||
        prediction.probabilityScore > day.aiProbabilityScore
      ) {
        day.aiProbabilityScore = prediction.probabilityScore;
        day.aiRiskLevel = prediction.riskLevel;
      }
    }

    return [...dayMap.values()].sort(
      (left, right) => left.date.getTime() - right.date.getTime(),
    );
  }

  private buildMetricEvolution(
    points: Array<{ date: string; value: number }>,
    higherIsBetter: boolean,
    stableThreshold: number,
  ): ReportStructuredDataDto['fatigueEvolution'] {
    if (points.length === 0) {
      return {
        average: 0,
        min: null,
        max: null,
        latest: null,
        change: 0,
        trend: 'stable',
        series: [],
      };
    }

    const values = points.map((point) => point.value);
    const midpoint = Math.ceil(points.length / 2);
    const firstHalf = values.slice(0, midpoint);
    const secondHalf = values.slice(midpoint);
    const baseline = this.average(firstHalf);
    const comparisonBase =
      secondHalf.length > 0 ? this.average(secondHalf) : baseline;
    const delta = this.toFixedNumber(comparisonBase - baseline);

    return {
      average: this.average(values),
      min: this.toFixedNumber(Math.min(...values)),
      max: this.toFixedNumber(Math.max(...values)),
      latest: this.toFixedNumber(values.at(-1) ?? null),
      change: delta,
      trend: this.resolveTrend(delta, higherIsBetter, stableThreshold),
      series: points.map((point) => ({
        date: point.date,
        value: this.toFixedNumber(point.value),
      })),
    };
  }

  private buildRecurringTriggers(
    days: ReportDaySnapshot[],
  ): ReportStructuredDataDto['recurringTriggers'] {
    const activeDays = days.length;

    if (activeDays === 0) {
      return [];
    }

    const highRiskDays = days.filter(
      (day) => (this.resolveCombinedProbability(day) ?? 0) >= 70,
    );
    const definitions: TriggerDefinition[] = [
      {
        key: 'short_sleep',
        label: 'Sono abaixo de 5h',
        source: 'daily_record',
        matcher: (day) => day.sleepHours !== null && day.sleepHours < 5,
      },
      {
        key: 'low_sleep_quality',
        label: 'Qualidade do sono baixa',
        source: 'daily_record',
        matcher: (day) => day.sleepQuality !== null && day.sleepQuality <= 4,
      },
      {
        key: 'high_fatigue',
        label: 'Fadiga alta',
        source: 'daily_record',
        matcher: (day) => day.fatigueLevel !== null && day.fatigueLevel >= 7,
      },
      {
        key: 'high_stress',
        label: 'Estresse alto',
        source: 'daily_record',
        matcher: (day) => day.stressLevel !== null && day.stressLevel >= 7,
      },
      {
        key: 'low_mood',
        label: 'Humor reduzido',
        source: 'daily_record',
        matcher: (day) => day.moodLevel !== null && day.moodLevel <= 4,
      },
      {
        key: 'low_hydration',
        label: 'Baixa hidratacao',
        source: 'daily_record',
        matcher: (day) => day.hydration !== null && day.hydration < 1.5,
      },
      {
        key: 'cold_weather',
        label: 'Sensacao de frio',
        source: 'daily_record',
        matcher: (day) =>
          this.isColdFeeling(day.weatherFeeling) || day.coldBodyTemperature,
      },
      {
        key: 'low_activity',
        label: 'Atividade fisica muito baixa',
        source: 'daily_record',
        matcher: (day) =>
          day.physicalActivity !== null && day.physicalActivity < 15,
      },
      {
        key: 'medication_not_taken',
        label: 'Medicacao nao registrada',
        source: 'daily_record',
        matcher: (day) => day.medicationTaken === false,
      },
      {
        key: 'cognitive_fog',
        label: 'Nevoa cognitiva',
        source: 'symptom_signal',
        matcher: (day) => day.cognitiveFog,
      },
      {
        key: 'headache',
        label: 'Cefaleia',
        source: 'symptom_signal',
        matcher: (day) => day.headache,
      },
      {
        key: 'digestive_issues',
        label: 'Alteracoes digestivas',
        source: 'symptom_signal',
        matcher: (day) => day.digestiveIssues,
      },
      {
        key: 'anxiety',
        label: 'Ansiedade',
        source: 'symptom_signal',
        matcher: (day) => day.anxiety,
      },
      {
        key: 'depression',
        label: 'Humor depressivo',
        source: 'symptom_signal',
        matcher: (day) => day.depression,
      },
    ];

    return definitions
      .map((definition) => {
        const occurrences = days.filter(definition.matcher).length;
        const highRiskOccurrences = highRiskDays.filter(
          definition.matcher,
        ).length;

        return {
          key: definition.key,
          label: definition.label,
          source: definition.source,
          occurrences,
          occurrenceRate: this.toFixedNumber((occurrences / activeDays) * 100),
          highRiskOccurrences,
          highRiskRate: this.toFixedNumber(
            highRiskDays.length > 0
              ? (highRiskOccurrences / highRiskDays.length) * 100
              : 0,
          ),
          evidence: `${definition.label} apareceu ${occurrences} vezes e coincidiu com ${highRiskOccurrences} dias de risco >= 70.`,
        };
      })
      .filter(
        (trigger) =>
          trigger.occurrences >= 2 || trigger.highRiskOccurrences > 0,
      )
      .sort((left, right) => {
        if (right.highRiskOccurrences !== left.highRiskOccurrences) {
          return right.highRiskOccurrences - left.highRiskOccurrences;
        }

        if (right.occurrenceRate !== left.occurrenceRate) {
          return right.occurrenceRate - left.occurrenceRate;
        }

        return right.occurrences - left.occurrences;
      })
      .slice(0, 8);
  }

  private buildCrisisProbability(
    days: ReportDaySnapshot[],
  ): ReportStructuredDataDto['crisisProbability'] {
    const dailySeries = days.map((day) => {
      const ruleBasedProbabilityScore = day.ruleBasedProbabilityScore;
      const aiProbabilityScore = day.aiProbabilityScore;
      const combinedProbabilityScore = this.resolveCombinedProbability(day);
      const highestSource =
        combinedProbabilityScore === null
          ? null
          : aiProbabilityScore !== null &&
              aiProbabilityScore === combinedProbabilityScore
            ? 'ai_prediction'
            : 'rule_engine';

      return {
        date: this.formatDateOnly(day.date),
        ruleBasedProbabilityScore,
        aiProbabilityScore,
        combinedProbabilityScore,
        highestSource,
      };
    });

    const scores = dailySeries
      .map((item) => item.combinedProbabilityScore)
      .filter((value): value is number => value !== null);
    const latestPoint =
      [...dailySeries]
        .reverse()
        .find((item) => item.combinedProbabilityScore !== null) ?? null;

    return {
      averageProbabilityScore: this.average(scores),
      maxProbabilityScore:
        scores.length > 0 ? this.toFixedNumber(Math.max(...scores)) : 0,
      highRiskDays: scores.filter((score) => score >= 70).length,
      urgentRiskDays: scores.filter((score) => score >= 90).length,
      latestProbabilityScore: latestPoint?.combinedProbabilityScore ?? null,
      latestRiskSource: latestPoint?.highestSource ?? null,
      dailySeries,
    };
  }

  private buildCorrelations(
    days: ReportDaySnapshot[],
  ): ReportStructuredDataDto['correlations'] {
    const pairs: CorrelationPairDefinition[] = [
      {
        key: 'sleep_hours_vs_crisis_probability',
        leftMetric: 'sleepHours',
        rightMetric: 'crisisProbability',
        left: (day) => day.sleepHours,
        right: (day) => this.resolveCombinedProbability(day),
      },
      {
        key: 'fatigue_vs_crisis_probability',
        leftMetric: 'fatigueLevel',
        rightMetric: 'crisisProbability',
        left: (day) => day.fatigueLevel,
        right: (day) => this.resolveCombinedProbability(day),
      },
      {
        key: 'stress_vs_crisis_probability',
        leftMetric: 'stressLevel',
        rightMetric: 'crisisProbability',
        left: (day) => day.stressLevel,
        right: (day) => this.resolveCombinedProbability(day),
      },
      {
        key: 'mood_vs_crisis_probability',
        leftMetric: 'moodLevel',
        rightMetric: 'crisisProbability',
        left: (day) => day.moodLevel,
        right: (day) => this.resolveCombinedProbability(day),
      },
      {
        key: 'hydration_vs_crisis_probability',
        leftMetric: 'hydration',
        rightMetric: 'crisisProbability',
        left: (day) => day.hydration,
        right: (day) => this.resolveCombinedProbability(day),
      },
      {
        key: 'activity_vs_crisis_probability',
        leftMetric: 'physicalActivity',
        rightMetric: 'crisisProbability',
        left: (day) => day.physicalActivity,
        right: (day) => this.resolveCombinedProbability(day),
      },
    ];

    return pairs
      .map((pair) => {
        const values = days
          .map((day) => ({
            left: pair.left(day),
            right: pair.right(day),
          }))
          .filter(
            (entry): entry is { left: number; right: number } =>
              entry.left !== null && entry.right !== null,
          );

        if (values.length < 4) {
          return null;
        }

        const coefficient = this.pearsonCorrelation(
          values.map((entry) => entry.left),
          values.map((entry) => entry.right),
        );

        if (coefficient === null) {
          return null;
        }

        const direction =
          coefficient > 0.15
            ? 'positive'
            : coefficient < -0.15
              ? 'negative'
              : 'none';
        const strength = this.resolveCorrelationStrength(coefficient);

        return {
          key: pair.key,
          leftMetric: pair.leftMetric,
          rightMetric: pair.rightMetric,
          coefficient: this.toFixedNumber(coefficient),
          direction,
          strength,
          sampleSize: values.length,
          insight: this.buildCorrelationInsight(
            pair.leftMetric,
            pair.rightMetric,
            direction,
          ),
        };
      })
      .filter(
        (
          item,
        ): item is NonNullable<
          ReturnType<ReportsService['buildCorrelations']>[number]
        > => item !== null,
      )
      .sort(
        (left, right) =>
          Math.abs(right.coefficient) - Math.abs(left.coefficient),
      )
      .slice(0, 6);
  }

  private buildPersonalizedRiskProfile(
    userRiskProfile: ReportUserRiskProfileRow | null,
  ): ReportStructuredDataDto['personalizedRiskProfile'] {
    if (!userRiskProfile) {
      return {
        available: false,
        currentPersonalizedScore: null,
        baselineScore: null,
        summary: null,
        lastAnalyzedAt: null,
        triggerPatterns: [],
        topWeights: [],
      };
    }

    const triggerPatterns = this.parseTriggerPatterns(
      userRiskProfile.triggerPatterns,
    )
      .sort((left, right) => right.evidenceCount - left.evidenceCount)
      .slice(0, 5);
    const topWeights = this.parsePersonalizedWeights(
      userRiskProfile.personalizedWeights,
    )
      .sort(
        (left, right) =>
          right.personalizedWeight - left.personalizedWeight ||
          right.lift - left.lift,
      )
      .slice(0, 5);

    return {
      available: true,
      currentPersonalizedScore: userRiskProfile.currentPersonalizedScore,
      baselineScore: userRiskProfile.baselineScore,
      summary: userRiskProfile.summary,
      lastAnalyzedAt: userRiskProfile.lastAnalyzedAt,
      triggerPatterns,
      topWeights,
    };
  }

  private mapReport(report: ReportDetails): ReportResponseDto {
    return {
      id: report.id,
      period: this.mapTypeToPeriod(report.type),
      status: report.status,
      periodStart: this.formatDateOnly(report.periodStart),
      periodEnd: this.formatDateOnly(report.periodEnd),
      generatedAt: report.generatedAt,
      fileUrl: report.fileUrl,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      data: this.parseStructuredData(report.summary),
    };
  }

  private getOrCreateDay(
    dayMap: Map<string, ReportDaySnapshot>,
    key: string,
    date: Date,
  ): ReportDaySnapshot {
    const current = dayMap.get(key);

    if (current) {
      return current;
    }

    const created: ReportDaySnapshot = {
      date: normalizeDateOnly(date),
      sleepHours: null,
      sleepQuality: null,
      fatigueLevel: null,
      moodLevel: null,
      stressLevel: null,
      physicalActivity: null,
      hydration: null,
      medicationTaken: null,
      weatherFeeling: null,
      ruleBasedProbabilityScore: null,
      ruleBasedRiskLevel: null,
      aiProbabilityScore: null,
      aiRiskLevel: null,
      cognitiveFog: false,
      sensitivityLight: false,
      sensitivityNoise: false,
      digestiveIssues: false,
      headache: false,
      anxiety: false,
      depression: false,
      coldBodyTemperature: false,
      signalCount: 0,
    };

    dayMap.set(key, created);
    return created;
  }

  private mapPeriodToType(period: ReportPeriod): ReportType {
    switch (period) {
      case ReportPeriod.WEEKLY:
        return ReportType.WEEKLY;
      case ReportPeriod.QUARTERLY:
        return ReportType.QUARTERLY;
      default:
        return ReportType.MONTHLY;
    }
  }

  private mapTypeToPeriod(type: ReportType): ReportPeriod {
    switch (type) {
      case ReportType.WEEKLY:
        return ReportPeriod.WEEKLY;
      case ReportType.QUARTERLY:
        return ReportPeriod.QUARTERLY;
      default:
        return ReportPeriod.MONTHLY;
    }
  }

  private parseStructuredData(
    summary: Prisma.JsonValue | null,
  ): ReportStructuredDataDto | null {
    if (!summary || typeof summary !== 'object' || Array.isArray(summary)) {
      return null;
    }

    return summary as unknown as ReportStructuredDataDto;
  }

  private parseTriggerPatterns(
    value: Prisma.JsonValue,
  ): TriggerPatternSnapshot[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return (value as unknown as TriggerPatternSnapshot[]).filter(
      (pattern) =>
        typeof pattern?.key === 'string' &&
        typeof pattern?.label === 'string' &&
        typeof pattern?.description === 'string' &&
        typeof pattern?.occurrenceRateBeforeCrisis === 'number' &&
        typeof pattern?.evidenceCount === 'number' &&
        (pattern?.strength === 'MEDIUM' || pattern?.strength === 'HIGH'),
    );
  }

  private parsePersonalizedWeights(
    value: Prisma.JsonValue,
  ): PersonalizedWeightSnapshot[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return (value as unknown as PersonalizedWeightSnapshot[]).filter(
      (weight) =>
        typeof weight?.key === 'string' &&
        typeof weight?.label === 'string' &&
        typeof weight?.personalizedWeight === 'number' &&
        typeof weight?.evidenceCount === 'number' &&
        typeof weight?.lift === 'number' &&
        typeof weight?.activeOnLatestDay === 'boolean',
    );
  }

  private resolveCombinedProbability(day: ReportDaySnapshot): number | null {
    if (
      day.ruleBasedProbabilityScore === null &&
      day.aiProbabilityScore === null
    ) {
      return null;
    }

    return Math.max(
      day.ruleBasedProbabilityScore ?? 0,
      day.aiProbabilityScore ?? 0,
    );
  }

  private resolveTrend(
    delta: number,
    higherIsBetter: boolean,
    stableThreshold: number,
  ): 'improving' | 'stable' | 'worsening' {
    if (Math.abs(delta) < stableThreshold) {
      return 'stable';
    }

    if (higherIsBetter) {
      return delta > 0 ? 'improving' : 'worsening';
    }

    return delta < 0 ? 'improving' : 'worsening';
  }

  private resolveCorrelationStrength(
    coefficient: number,
  ): 'weak' | 'moderate' | 'strong' {
    const absoluteValue = Math.abs(coefficient);

    if (absoluteValue >= 0.7) {
      return 'strong';
    }

    if (absoluteValue >= 0.4) {
      return 'moderate';
    }

    return 'weak';
  }

  private buildCorrelationInsight(
    leftMetric: string,
    rightMetric: string,
    direction: 'positive' | 'negative' | 'none',
  ): string {
    if (direction === 'none') {
      return `Nao houve correlacao consistente entre ${leftMetric} e ${rightMetric} nesta janela.`;
    }

    if (direction === 'negative') {
      return `Quando ${leftMetric} cai, ${rightMetric} tende a subir nesta janela.`;
    }

    return `Quando ${leftMetric} sobe, ${rightMetric} tambem tende a subir nesta janela.`;
  }

  private pearsonCorrelation(left: number[], right: number[]): number | null {
    if (left.length !== right.length || left.length < 2) {
      return null;
    }

    const leftMean = this.average(left);
    const rightMean = this.average(right);
    let numerator = 0;
    let leftVariance = 0;
    let rightVariance = 0;

    for (let index = 0; index < left.length; index += 1) {
      const leftDelta = left[index]! - leftMean;
      const rightDelta = right[index]! - rightMean;
      numerator += leftDelta * rightDelta;
      leftVariance += leftDelta ** 2;
      rightVariance += rightDelta ** 2;
    }

    if (leftVariance === 0 || rightVariance === 0) {
      return null;
    }

    return numerator / Math.sqrt(leftVariance * rightVariance);
  }

  private isColdFeeling(value: string | null | undefined): boolean {
    if (!value) {
      return false;
    }

    const normalizedValue = value.trim().toLowerCase();
    return ['frio', 'friagem', 'cold', 'cold front', 'gelado'].some((token) =>
      normalizedValue.includes(token),
    );
  }

  private average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    return this.toFixedNumber(
      values.reduce((sum, value) => sum + value, 0) / values.length,
    );
  }

  private formatDateOnly(date: Date): string {
    return normalizeDateOnly(date).toISOString().slice(0, 10);
  }

  private toFixedNumber(value: number | null): number {
    if (value === null || Number.isNaN(value)) {
      return 0;
    }

    return Number(value.toFixed(2));
  }

  private toJsonValue(value: ReportStructuredDataDto): Prisma.InputJsonValue {
    return value as unknown as Prisma.InputJsonValue;
  }
}
