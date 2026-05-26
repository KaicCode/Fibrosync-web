import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RiskLevel, type Prisma } from '@prisma/client';
import { addDays, normalizeDateOnly } from '@/common/utils/date.util';
import { PrismaService } from '@/database/prisma.service';
import { PatternScoreEngine } from './pattern-score.engine';
import {
  userRiskProfileSelect,
  type UserRiskProfileDetails,
} from './user-risk-profile.select';
import type { AnalyzePatternsDto } from './dto/analyze-patterns.dto';
import type { UserRiskProfileResponseDto } from './dto/user-risk-profile-response.dto';
import type { PatternAnalysisDay } from './types/pattern-analysis-day.type';
import type {
  PersonalizedWeight,
  TriggerPattern,
  UserRiskProfileSnapshot,
} from './types/user-risk-profile.type';

const patternAnalysisDailyRecordSelect = {
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

const patternAnalysisSymptomSignalSelect = {
  createdAt: true,
  fatigueLevel: true,
  sleepQuality: true,
  stiffness: true,
  mood: true,
  stress: true,
  cognitiveFog: true,
  sensitivityLight: true,
  sensitivityNoise: true,
  digestiveIssues: true,
  headache: true,
  anxiety: true,
  depression: true,
  bodyTemperatureFeeling: true,
} satisfies Prisma.SymptomSignalSelect;

type PatternAnalysisDailyRecordRow = Prisma.DailyRecordGetPayload<{
  select: typeof patternAnalysisDailyRecordSelect;
}>;

type PatternAnalysisSymptomSignalRow = Prisma.SymptomSignalGetPayload<{
  select: typeof patternAnalysisSymptomSignalSelect;
}>;

@Injectable()
export class PatternAnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly patternScoreEngine: PatternScoreEngine,
  ) {}

  async analyzeUserPatterns(
    userId: string,
    requestedLookbackDays?: number,
  ): Promise<UserRiskProfileResponseDto> {
    const lookbackDays = this.resolveLookbackDays(requestedLookbackDays);
    const sourceWindowEnd = normalizeDateOnly(new Date());
    const sourceWindowStart = addDays(sourceWindowEnd, -(lookbackDays - 1));

    const [dailyRecords, symptomSignals] = await this.prisma.$transaction([
      this.prisma.dailyRecord.findMany({
        where: {
          userId,
          recordDate: {
            gte: sourceWindowStart,
          },
        },
        select: patternAnalysisDailyRecordSelect,
        orderBy: [{ recordDate: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.symptomSignal.findMany({
        where: {
          userId,
          createdAt: {
            gte: sourceWindowStart,
          },
        },
        select: patternAnalysisSymptomSignalSelect,
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    if (dailyRecords.length === 0 && symptomSignals.length === 0) {
      throw new NotFoundException(
        'Not enough historical data is available to build a personalized risk profile.',
      );
    }

    const days = this.buildPatternAnalysisDays(dailyRecords, symptomSignals);
    const analysis = this.patternScoreEngine.analyze(days);

    const profile = await this.prisma.userRiskProfile.upsert({
      where: {
        userId,
      },
      update: {
        analysisWindowDays: lookbackDays,
        currentPersonalizedScore: analysis.currentPersonalizedScore,
        baselineScore: analysis.baselineScore,
        lastCrisisSignalCount: analysis.lastCrisisSignalCount,
        summary: analysis.summary,
        triggerPatterns: this.toJsonValue(analysis.triggerPatterns),
        personalizedWeights: this.toJsonValue(analysis.personalizedWeights),
        sourceWindowStart,
        sourceWindowEnd,
        lastAnalyzedAt: new Date(),
      },
      create: {
        userId,
        analysisWindowDays: lookbackDays,
        currentPersonalizedScore: analysis.currentPersonalizedScore,
        baselineScore: analysis.baselineScore,
        lastCrisisSignalCount: analysis.lastCrisisSignalCount,
        summary: analysis.summary,
        triggerPatterns: this.toJsonValue(analysis.triggerPatterns),
        personalizedWeights: this.toJsonValue(analysis.personalizedWeights),
        sourceWindowStart,
        sourceWindowEnd,
        lastAnalyzedAt: new Date(),
      },
      select: userRiskProfileSelect,
    });

    return this.mapProfile(profile);
  }

  async analyzeFromDto(
    userId: string,
    dto: AnalyzePatternsDto,
  ): Promise<UserRiskProfileResponseDto> {
    return this.analyzeUserPatterns(userId, dto.lookbackDays);
  }

  async getLatestProfileForUser(
    userId: string,
  ): Promise<UserRiskProfileResponseDto> {
    const profile = await this.prisma.userRiskProfile.findUnique({
      where: {
        userId,
      },
      select: userRiskProfileSelect,
    });

    if (!profile) {
      throw new NotFoundException(
        'No personalized risk profile was generated for this user yet.',
      );
    }

    return this.mapProfile(profile);
  }

  async getOrAnalyzeCurrentProfile(
    userId: string,
  ): Promise<UserRiskProfileSnapshot> {
    const today = normalizeDateOnly(new Date());
    const expectedWindowDays = this.resolveLookbackDays();
    const [profile, latestDailyRecord, latestSymptomSignal] =
      await this.prisma.$transaction([
        this.prisma.userRiskProfile.findUnique({
          where: {
            userId,
          },
          select: userRiskProfileSelect,
        }),
        this.prisma.dailyRecord.findFirst({
          where: {
            userId,
          },
          select: {
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        }),
        this.prisma.symptomSignal.findFirst({
          where: {
            userId,
          },
          select: {
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        }),
      ]);

    const latestDataUpdatedAt = [
      latestDailyRecord?.updatedAt,
      latestSymptomSignal?.updatedAt,
    ]
      .filter((value): value is Date => value instanceof Date)
      .sort((left, right) => right.getTime() - left.getTime())[0];

    if (
      !profile ||
      profile.analysisWindowDays !== expectedWindowDays ||
      normalizeDateOnly(profile.sourceWindowEnd).getTime() !==
        today.getTime() ||
      (latestDataUpdatedAt !== undefined &&
        latestDataUpdatedAt.getTime() > profile.updatedAt.getTime())
    ) {
      return this.analyzeUserPatterns(userId, expectedWindowDays);
    }

    return this.mapProfile(profile);
  }

  private buildPatternAnalysisDays(
    dailyRecords: PatternAnalysisDailyRecordRow[],
    symptomSignals: PatternAnalysisSymptomSignalRow[],
  ): PatternAnalysisDay[] {
    const dayMap = new Map<string, PatternAnalysisDay>();

    for (const record of dailyRecords) {
      const key = record.recordDate.toISOString().slice(0, 10);
      const day = this.getOrCreateDay(dayMap, key);

      day.sleepHours = record.sleepHours;
      day.sleepQuality = record.sleepQuality;
      day.fatigueLevel = record.fatigueLevel;
      day.mood = record.moodLevel;
      day.stressLevel = record.stressLevel;
      day.physicalActivity = record.exerciseMinutes;
      day.hydration = record.waterIntakeLiters;
      day.medicationTaken = record.medicationAdherence;
      day.weatherFeeling = record.weatherFeeling;
      day.riskProbability =
        record.crisisPrediction !== null
          ? Math.round(record.crisisPrediction.probability * 100)
          : null;
      day.riskLevel = record.crisisPrediction?.riskLevel ?? null;
      day.isPrecursorDay =
        record.crisisPrediction?.riskLevel === RiskLevel.HIGH ||
        record.crisisPrediction?.riskLevel === RiskLevel.CRITICAL ||
        (record.crisisPrediction?.probability ?? 0) >= 0.6;
    }

    for (const signal of symptomSignals) {
      const key = signal.createdAt.toISOString().slice(0, 10);
      const day = this.getOrCreateDay(dayMap, key);

      day.fatigueLevel = this.maxNullable(
        day.fatigueLevel,
        signal.fatigueLevel,
      );
      day.sleepQuality = this.minNullable(
        day.sleepQuality,
        signal.sleepQuality,
      );
      day.stiffness = this.maxNullable(day.stiffness, signal.stiffness);
      day.mood = this.minNullable(day.mood, signal.mood);
      day.stressLevel = this.maxNullable(day.stressLevel, signal.stress);
      day.cognitiveFog = day.cognitiveFog || signal.cognitiveFog;
      day.sensitivityLight = day.sensitivityLight || signal.sensitivityLight;
      day.sensitivityNoise = day.sensitivityNoise || signal.sensitivityNoise;
      day.digestiveIssues = day.digestiveIssues || signal.digestiveIssues;
      day.headache = day.headache || signal.headache;
      day.anxiety = day.anxiety || signal.anxiety;
      day.depression = day.depression || signal.depression;

      if (signal.bodyTemperatureFeeling?.trim()) {
        const feeling = signal.bodyTemperatureFeeling.trim();

        if (!day.bodyTemperatureFeelings.includes(feeling)) {
          day.bodyTemperatureFeelings.push(feeling);
        }
      }
    }

    return [...dayMap.values()].sort((left, right) =>
      left.date.localeCompare(right.date),
    );
  }

  private getOrCreateDay(
    dayMap: Map<string, PatternAnalysisDay>,
    key: string,
  ): PatternAnalysisDay {
    const existing = dayMap.get(key);

    if (existing) {
      return existing;
    }

    const created: PatternAnalysisDay = {
      date: key,
      sleepHours: null,
      sleepQuality: null,
      fatigueLevel: null,
      mood: null,
      stressLevel: null,
      physicalActivity: null,
      hydration: null,
      medicationTaken: null,
      weatherFeeling: null,
      bodyTemperatureFeelings: [],
      stiffness: null,
      cognitiveFog: false,
      sensitivityLight: false,
      sensitivityNoise: false,
      digestiveIssues: false,
      headache: false,
      anxiety: false,
      depression: false,
      riskProbability: null,
      riskLevel: null,
      isPrecursorDay: false,
    };

    dayMap.set(key, created);
    return created;
  }

  private maxNullable(
    current: number | null,
    next: number | null,
  ): number | null {
    if (current === null) {
      return next;
    }

    if (next === null) {
      return current;
    }

    return Math.max(current, next);
  }

  private minNullable(
    current: number | null,
    next: number | null,
  ): number | null {
    if (current === null) {
      return next;
    }

    if (next === null) {
      return current;
    }

    return Math.min(current, next);
  }

  private resolveLookbackDays(requestedLookbackDays?: number): number {
    const configured =
      this.configService.get<number>('ai.patternAnalysisLookbackDays') ?? 30;
    const resolved = requestedLookbackDays ?? configured;
    return Math.min(Math.max(Math.round(resolved), 14), 90);
  }

  private mapProfile(
    profile: UserRiskProfileDetails,
  ): UserRiskProfileResponseDto {
    return {
      id: profile.id,
      analysisWindowDays: profile.analysisWindowDays,
      currentPersonalizedScore: profile.currentPersonalizedScore,
      baselineScore: profile.baselineScore,
      lastCrisisSignalCount: profile.lastCrisisSignalCount,
      summary: profile.summary,
      triggerPatterns: this.parseTriggerPatterns(profile.triggerPatterns),
      personalizedWeights: this.parsePersonalizedWeights(
        profile.personalizedWeights,
      ),
      sourceWindowStart: profile.sourceWindowStart.toISOString().slice(0, 10),
      sourceWindowEnd: profile.sourceWindowEnd.toISOString().slice(0, 10),
      lastAnalyzedAt: profile.lastAnalyzedAt.toISOString(),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  private parseTriggerPatterns(value: Prisma.JsonValue): TriggerPattern[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value as unknown as TriggerPattern[];
  }

  private parsePersonalizedWeights(
    value: Prisma.JsonValue,
  ): PersonalizedWeight[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value as unknown as PersonalizedWeight[];
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
