import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InsightStatus, InsightType, type Prisma } from '@prisma/client';
import { addDays, normalizeDateOnly } from '@/common/utils/date.util';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import { PrismaService } from '@/database/prisma.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { parseWeatherSnapshotFromMetadata } from '@/modules/weather/weather.types';
import {
  aiPredictionResponseSelect,
  type AiPredictionDetails,
} from './ai-prediction.select';
import { PatternAnalysisService } from './pattern-analysis.service';
import { AI_PREDICTION_PROVIDER } from './prediction-providers/ai-prediction-provider.token';
import type { AiPredictionProvider } from './prediction-providers/ai-prediction-provider.interface';
import type { AiPredictionResponseDto } from './dto/ai-prediction-response.dto';
import type { AiInsightQueryDto } from './dto/ai-insight-query.dto';
import type { GenerateAiInsightDto } from './dto/generate-ai-insight.dto';
import type { PredictAiDto } from './dto/predict-ai.dto';
import type {
  AiPredictionContext,
  AiPredictionDailyRecordSnapshot,
  AiPredictionSummary,
  AiPredictionSymptomSignalSnapshot,
  LatestRuleBasedPredictionSnapshot,
} from './types/ai-prediction-context.type';

const dailyRecordPredictionContextSelect = {
  id: true,
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
  metadata: true,
  notes: true,
  createdAt: true,
} satisfies Prisma.DailyRecordSelect;

const symptomSignalPredictionContextSelect = {
  id: true,
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
  notes: true,
} satisfies Prisma.SymptomSignalSelect;

type DailyRecordPredictionContextRow = Prisma.DailyRecordGetPayload<{
  select: typeof dailyRecordPredictionContextSelect;
}>;

type SymptomSignalPredictionContextRow = Prisma.SymptomSignalGetPayload<{
  select: typeof symptomSignalPredictionContextSelect;
}>;

type RuleBasedPredictionContextRow = Prisma.CrisisPredictionGetPayload<{
  select: {
    predictedFor: true;
    probability: true;
    riskLevel: true;
    recommendationSummary: true;
  };
}>;

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly patternAnalysisService: PatternAnalysisService,
    @Inject(AI_PREDICTION_PROVIDER)
    private readonly aiPredictionProvider: AiPredictionProvider,
  ) {}

  async predict(
    userId: string,
    dto: PredictAiDto,
  ): Promise<AiPredictionResponseDto> {
    const context = await this.buildPredictionContext(userId, dto.lookbackDays);
    const result = await this.aiPredictionProvider.predict(context);

    const prediction = await this.prisma.aiPrediction.create({
      data: {
        userId,
        dailyRecordId: context.latestDailyRecordId,
        provider: result.provider,
        model: result.model,
        promptVersion: context.promptVersion,
        probabilityScore: result.probabilityScore,
        riskLevel: result.riskLevel,
        explanation: result.explanation,
        suggestedAction: result.suggestedAction,
        inputSnapshot: this.toJsonValue(context),
        providerResponse: result.providerResponse
          ? this.toJsonValue(result.providerResponse)
          : undefined,
      },
      select: aiPredictionResponseSelect,
    });

    await this.notificationsService.createOrRefreshAiPredictionAlert({
      id: prediction.id,
      userId,
      probabilityScore: prediction.probabilityScore,
      riskLevel: prediction.riskLevel,
      explanation: prediction.explanation,
      suggestedAction: prediction.suggestedAction,
      triggerPatternLabels: context.userRiskProfile.triggerPatterns.map(
        (pattern) => pattern.label,
      ),
      repeatedCycles: context.summary.repeatedCycles,
    });

    return this.mapPrediction(prediction);
  }

  async generateInsight(
    userId: string,
    dto: GenerateAiInsightDto,
  ): Promise<unknown> {
    const context = dto.dailyRecordId
      ? await this.getSingleRecordContext(userId, dto.dailyRecordId)
      : await this.getRollingContext(userId);

    const generated = this.composeInsight(context, dto.type);

    return this.prisma.aIInsight.create({
      data: {
        userId,
        dailyRecordId: context.dailyRecordId,
        type: generated.type,
        title: generated.title,
        content: generated.content,
        relevanceScore: generated.relevanceScore,
        status: InsightStatus.ACTIVE,
        metadata: generated.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async listForUser(
    userId: string,
    query: AiInsightQueryDto,
  ): Promise<{
    items: unknown[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where: Prisma.AIInsightWhereInput = {
      userId,
      type: query.type,
      status: query.status,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.aIInsight.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.aIInsight.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  private async buildPredictionContext(
    userId: string,
    requestedLookbackDays?: number,
  ): Promise<AiPredictionContext> {
    const configuredLookbackDays =
      this.configService.get<number>('ai.predictionLookbackDays') ?? 21;
    const promptVersion =
      this.configService.get<string>('ai.promptVersion') ?? 'v1';
    const lookbackDays = this.clampLookbackDays(
      requestedLookbackDays ?? configuredLookbackDays,
    );
    const since = addDays(normalizeDateOnly(new Date()), -(lookbackDays - 1));
    const userRiskProfile =
      await this.patternAnalysisService.getOrAnalyzeCurrentProfile(userId);

    const [dailyRecordsRaw, symptomSignalsRaw, latestRuleBasedPredictionRaw] =
      await this.prisma.$transaction([
        this.prisma.dailyRecord.findMany({
          where: {
            userId,
            recordDate: {
              gte: since,
            },
          },
          select: dailyRecordPredictionContextSelect,
          orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }],
        }),
        this.prisma.symptomSignal.findMany({
          where: {
            userId,
            createdAt: {
              gte: since,
            },
          },
          select: symptomSignalPredictionContextSelect,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.crisisPrediction.findFirst({
          where: {
            userId,
            predictedFor: {
              gte: since,
            },
          },
          select: {
            predictedFor: true,
            probability: true,
            riskLevel: true,
            recommendationSummary: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ]);

    if (dailyRecordsRaw.length === 0 && symptomSignalsRaw.length === 0) {
      throw new NotFoundException(
        'Not enough daily records or symptom signals are available for AI prediction.',
      );
    }

    const dailyRecords = dailyRecordsRaw.map((record) =>
      this.mapDailyRecordSnapshot(record),
    );
    const symptomSignals = symptomSignalsRaw.map((signal) =>
      this.mapSymptomSignalSnapshot(signal),
    );

    return {
      generatedAt: new Date().toISOString(),
      lookbackDays,
      promptVersion,
      latestDailyRecordId: dailyRecords[0]?.id,
      dailyRecords,
      symptomSignals,
      latestRuleBasedPrediction: latestRuleBasedPredictionRaw
        ? this.mapRuleBasedPrediction(latestRuleBasedPredictionRaw)
        : undefined,
      summary: this.buildPredictionSummary(dailyRecords, symptomSignals),
      userRiskProfile,
    };
  }

  private mapDailyRecordSnapshot(
    record: DailyRecordPredictionContextRow,
  ): AiPredictionDailyRecordSnapshot {
    return {
      id: record.id,
      recordDate: record.recordDate.toISOString().slice(0, 10),
      sleepHours: record.sleepHours,
      sleepQuality: record.sleepQuality,
      fatigueLevel: record.fatigueLevel,
      mood: record.moodLevel,
      stressLevel: record.stressLevel,
      physicalActivity: record.exerciseMinutes,
      hydration: record.waterIntakeLiters,
      weatherFeeling: record.weatherFeeling,
      weatherSnapshot: parseWeatherSnapshotFromMetadata(record.metadata),
      medicationTaken: record.medicationAdherence,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private mapSymptomSignalSnapshot(
    signal: SymptomSignalPredictionContextRow,
  ): AiPredictionSymptomSignalSnapshot {
    return {
      id: signal.id,
      createdAt: signal.createdAt.toISOString(),
      fatigueLevel: signal.fatigueLevel,
      sleepQuality: signal.sleepQuality,
      stiffness: signal.stiffness,
      mood: signal.mood,
      stress: signal.stress,
      cognitiveFog: signal.cognitiveFog,
      sensitivityLight: signal.sensitivityLight,
      sensitivityNoise: signal.sensitivityNoise,
      digestiveIssues: signal.digestiveIssues,
      headache: signal.headache,
      anxiety: signal.anxiety,
      depression: signal.depression,
      bodyTemperatureFeeling: signal.bodyTemperatureFeeling,
      notes: signal.notes,
    };
  }

  private mapRuleBasedPrediction(
    prediction: RuleBasedPredictionContextRow,
  ): LatestRuleBasedPredictionSnapshot {
    return {
      predictedFor: prediction.predictedFor.toISOString().slice(0, 10),
      probabilityScore: Math.round(prediction.probability * 100),
      riskLevel: prediction.riskLevel,
      recommendationSummary: prediction.recommendationSummary,
    };
  }

  private buildPredictionSummary(
    dailyRecords: AiPredictionDailyRecordSnapshot[],
    symptomSignals: AiPredictionSymptomSignalSnapshot[],
  ): AiPredictionSummary {
    const sleepHours = dailyRecords
      .map((record) => record.sleepHours)
      .filter((value): value is number => value !== null);
    const sleepQuality = dailyRecords
      .map((record) => record.sleepQuality)
      .filter((value): value is number => value !== null);
    const physicalActivity = dailyRecords
      .map((record) => record.physicalActivity)
      .filter((value): value is number => value !== null);
    const hydration = dailyRecords
      .map((record) => record.hydration)
      .filter((value): value is number => value !== null);
    const temperatures = dailyRecords
      .map((record) => record.weatherSnapshot?.temperature ?? null)
      .filter((value): value is number => value !== null);
    const humidityLevels = dailyRecords
      .map((record) => record.weatherSnapshot?.humidity ?? null)
      .filter((value): value is number => value !== null);
    const pressures = dailyRecords
      .map((record) => record.weatherSnapshot?.pressure ?? null)
      .filter((value): value is number => value !== null);
    const apparentTemperatures = dailyRecords
      .map((record) => record.weatherSnapshot?.apparentTemperature ?? null)
      .filter((value): value is number => value !== null);
    const medicationFlags = dailyRecords
      .map((record) => record.medicationTaken)
      .filter((value): value is boolean => value !== null);

    return {
      dailyRecordCount: dailyRecords.length,
      symptomSignalCount: symptomSignals.length,
      averageSleepHours: this.average(sleepHours),
      averageSleepQuality: this.average(sleepQuality),
      averageFatigueLevel: this.average(
        dailyRecords.map((record) => record.fatigueLevel),
      ),
      averageMood: this.average(dailyRecords.map((record) => record.mood)),
      averageStressLevel: this.average(
        dailyRecords.map((record) => record.stressLevel),
      ),
      averagePhysicalActivity: this.average(physicalActivity),
      averageHydration: this.average(hydration),
      averageTemperature: this.average(temperatures),
      averageHumidity: this.average(humidityLevels),
      averagePressure: this.average(pressures),
      averageApparentTemperature: this.average(apparentTemperatures),
      medicationTakenRate:
        medicationFlags.length > 0
          ? Number(
              (
                (medicationFlags.filter(Boolean).length /
                  medicationFlags.length) *
                100
              ).toFixed(2),
            )
          : null,
      lowSleepDays: dailyRecords.filter(
        (record) => record.sleepHours !== null && record.sleepHours < 6,
      ).length,
      highFatigueDays: dailyRecords.filter((record) => record.fatigueLevel >= 7)
        .length,
      highStressDays: dailyRecords.filter((record) => record.stressLevel >= 7)
        .length,
      rainyDays: dailyRecords.filter(
        (record) => (record.weatherSnapshot?.precipitation ?? 0) > 0,
      ).length,
      lowPressureDays: dailyRecords.filter(
        (record) =>
          record.weatherSnapshot !== null &&
          record.weatherSnapshot.pressure < 1000,
      ).length,
      indirectSymptomCounts: {
        cognitiveFog: symptomSignals.filter((signal) => signal.cognitiveFog)
          .length,
        sensitivityLight: symptomSignals.filter(
          (signal) => signal.sensitivityLight,
        ).length,
        sensitivityNoise: symptomSignals.filter(
          (signal) => signal.sensitivityNoise,
        ).length,
        digestiveIssues: symptomSignals.filter(
          (signal) => signal.digestiveIssues,
        ).length,
        headache: symptomSignals.filter((signal) => signal.headache).length,
        anxiety: symptomSignals.filter((signal) => signal.anxiety).length,
        depression: symptomSignals.filter((signal) => signal.depression).length,
      },
      dominantWeatherFeelings: this.topLabels(
        dailyRecords.map((record) => record.weatherFeeling),
      ),
      dominantTemperatureFeelings: this.topLabels(
        symptomSignals.map((signal) => signal.bodyTemperatureFeeling),
      ),
      repeatedCycles: this.detectRepeatedCycles(dailyRecords, symptomSignals),
    };
  }

  private detectRepeatedCycles(
    dailyRecords: AiPredictionDailyRecordSnapshot[],
    symptomSignals: AiPredictionSymptomSignalSnapshot[],
  ): string[] {
    const cycles: string[] = [];
    const ascendingRecords = [...dailyRecords].sort((left, right) =>
      left.recordDate.localeCompare(right.recordDate),
    );

    let poorSleepThenFatigue = 0;
    let stressThenLowMood = 0;
    let lowHydrationThenFatigue = 0;
    let skippedMedicationThenStressOrFatigue = 0;
    let coldHumidDays = 0;
    let lowPressureDays = 0;

    for (let index = 0; index < ascendingRecords.length - 1; index += 1) {
      const current = ascendingRecords[index]!;
      const next = ascendingRecords[index + 1]!;

      if (current.sleepHours !== null && current.sleepHours < 6) {
        if (next.fatigueLevel >= 7) {
          poorSleepThenFatigue += 1;
        }
      }

      if (current.stressLevel >= 7 && next.mood <= 4) {
        stressThenLowMood += 1;
      }

      if (current.hydration !== null && current.hydration < 1.5) {
        if (next.fatigueLevel >= 7) {
          lowHydrationThenFatigue += 1;
        }
      }

      if (current.medicationTaken === false) {
        if (next.stressLevel >= 7 || next.fatigueLevel >= 7) {
          skippedMedicationThenStressOrFatigue += 1;
        }
      }

      if (
        current.weatherSnapshot !== null &&
        current.weatherSnapshot.temperature < 20 &&
        current.weatherSnapshot.humidity > 70
      ) {
        coldHumidDays += 1;
      }

      if (
        current.weatherSnapshot !== null &&
        current.weatherSnapshot.pressure < 1000
      ) {
        lowPressureDays += 1;
      }
    }

    const sameDayStressAndFatigue = dailyRecords.filter(
      (record) => record.stressLevel >= 7 && record.fatigueLevel >= 7,
    ).length;
    const fogWithSensitivity = symptomSignals.filter(
      (signal) =>
        signal.cognitiveFog &&
        (signal.sensitivityLight || signal.sensitivityNoise),
    ).length;
    const digestiveAndMoodLoad = symptomSignals.filter(
      (signal) =>
        signal.digestiveIssues && (signal.anxiety || signal.depression),
    ).length;

    if (poorSleepThenFatigue > 0) {
      cycles.push(
        `Poor sleep was followed by higher fatigue in ${poorSleepThenFatigue} recent day-to-day transition${this.pluralSuffix(
          poorSleepThenFatigue,
        )}.`,
      );
    }

    if (stressThenLowMood > 0) {
      cycles.push(
        `High stress was followed by lower mood in ${stressThenLowMood} recent transition${this.pluralSuffix(
          stressThenLowMood,
        )}.`,
      );
    }

    if (lowHydrationThenFatigue > 0) {
      cycles.push(
        `Lower hydration preceded fatigue spikes in ${lowHydrationThenFatigue} transition${this.pluralSuffix(
          lowHydrationThenFatigue,
        )}.`,
      );
    }

    if (skippedMedicationThenStressOrFatigue > 0) {
      cycles.push(
        `Days without medication adherence were followed by higher stress or fatigue in ${skippedMedicationThenStressOrFatigue} transition${this.pluralSuffix(
          skippedMedicationThenStressOrFatigue,
        )}.`,
      );
    }

    if (coldHumidDays > 0) {
      cycles.push(
        `Cold and humid weather was present on ${coldHumidDays} recent day${this.pluralSuffix(
          coldHumidDays,
        )}.`,
      );
    }

    if (lowPressureDays > 0) {
      cycles.push(
        `Lower atmospheric pressure appeared on ${lowPressureDays} recent day${this.pluralSuffix(
          lowPressureDays,
        )}.`,
      );
    }

    if (sameDayStressAndFatigue > 0) {
      cycles.push(
        `High stress and high fatigue appeared together on ${sameDayStressAndFatigue} recorded day${this.pluralSuffix(
          sameDayStressAndFatigue,
        )}.`,
      );
    }

    if (fogWithSensitivity > 0) {
      cycles.push(
        `Cognitive fog appeared alongside sensory sensitivity in ${fogWithSensitivity} symptom snapshot${this.pluralSuffix(
          fogWithSensitivity,
        )}.`,
      );
    }

    if (digestiveAndMoodLoad > 0) {
      cycles.push(
        `Digestive issues coincided with anxiety or depression in ${digestiveAndMoodLoad} symptom snapshot${this.pluralSuffix(
          digestiveAndMoodLoad,
        )}.`,
      );
    }

    if (cycles.length === 0) {
      cycles.push(
        'No strong repeated cycle was detected from the currently available tracking window.',
      );
    }

    return cycles.slice(0, 6);
  }

  private average(values: number[]): number | null {
    if (values.length === 0) {
      return null;
    }

    return Number(
      (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(
        2,
      ),
    );
  }

  private topLabels(values: Array<string | null>, limit = 3): string[] {
    const counts = new Map<string, { label: string; count: number }>();

    for (const value of values) {
      const label = value?.trim();

      if (!label) {
        continue;
      }

      const key = label.toLowerCase();
      const current = counts.get(key);

      counts.set(key, {
        label: current?.label ?? label,
        count: (current?.count ?? 0) + 1,
      });
    }

    return [...counts.values()]
      .sort(
        (left, right) =>
          right.count - left.count || left.label.localeCompare(right.label),
      )
      .slice(0, limit)
      .map((entry) => entry.label);
  }

  private clampLookbackDays(value: number): number {
    return Math.min(Math.max(Math.round(value), 7), 90);
  }

  private pluralSuffix(value: number): string {
    return value === 1 ? '' : 's';
  }

  private mapPrediction(
    prediction: AiPredictionDetails,
  ): AiPredictionResponseDto {
    return {
      id: prediction.id,
      dailyRecordId: prediction.dailyRecordId,
      provider: prediction.provider,
      model: prediction.model,
      promptVersion: prediction.promptVersion,
      probabilityScore: prediction.probabilityScore,
      riskLevel: prediction.riskLevel,
      explanation: prediction.explanation,
      suggestedAction: prediction.suggestedAction,
      createdAt: prediction.createdAt,
      updatedAt: prediction.updatedAt,
    };
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private async getSingleRecordContext(
    userId: string,
    dailyRecordId: string,
  ): Promise<{
    dailyRecordId: string;
    painLevel: number;
    fatigueLevel: number;
    stressLevel: number;
    moodLevel: number;
    sleepHours: number | null;
    predictionProbability: number | null;
    predictionRiskLevel: string | null;
    symptomNames: string[];
  }> {
    const record = await this.prisma.dailyRecord.findFirst({
      where: {
        id: dailyRecordId,
        userId,
      },
      include: {
        crisisPrediction: true,
        symptomEntries: {
          include: {
            symptom: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Daily record not found for AI analysis.');
    }

    return {
      dailyRecordId: record.id,
      painLevel: record.painLevel,
      fatigueLevel: record.fatigueLevel,
      stressLevel: record.stressLevel,
      moodLevel: record.moodLevel,
      sleepHours: record.sleepHours,
      predictionProbability: record.crisisPrediction?.probability ?? null,
      predictionRiskLevel: record.crisisPrediction?.riskLevel ?? null,
      symptomNames: record.symptomEntries.map((entry) => entry.symptom.name),
    };
  }

  private async getRollingContext(userId: string): Promise<{
    dailyRecordId?: string;
    painLevel: number;
    fatigueLevel: number;
    stressLevel: number;
    moodLevel: number;
    sleepHours: number | null;
    predictionProbability: number | null;
    predictionRiskLevel: string | null;
    symptomNames: string[];
  }> {
    const records = await this.prisma.dailyRecord.findMany({
      where: {
        userId,
      },
      include: {
        crisisPrediction: true,
        symptomEntries: {
          include: {
            symptom: true,
          },
        },
      },
      orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }],
      take: 7,
    });

    if (records.length === 0) {
      throw new NotFoundException(
        'No daily records available for AI analysis.',
      );
    }

    const average = (values: number[]): number =>
      values.length > 0
        ? Number(
            (
              values.reduce((sum, value) => sum + value, 0) / values.length
            ).toFixed(2),
          )
        : 0;
    const latest = records[0]!;
    const symptomNames = [
      ...new Set(
        records.flatMap((record) =>
          record.symptomEntries.map((entry) => entry.symptom.name),
        ),
      ),
    ];

    return {
      dailyRecordId: latest.id,
      painLevel: average(records.map((record) => record.painLevel)),
      fatigueLevel: average(records.map((record) => record.fatigueLevel)),
      stressLevel: average(records.map((record) => record.stressLevel)),
      moodLevel: average(records.map((record) => record.moodLevel)),
      sleepHours: average(
        records
          .map((record) => record.sleepHours)
          .filter((value): value is number => value !== null),
      ),
      predictionProbability: latest.crisisPrediction?.probability ?? null,
      predictionRiskLevel: latest.crisisPrediction?.riskLevel ?? null,
      symptomNames,
    };
  }

  private composeInsight(
    context: {
      dailyRecordId?: string;
      painLevel: number;
      fatigueLevel: number;
      stressLevel: number;
      moodLevel: number;
      sleepHours: number | null;
      predictionProbability: number | null;
      predictionRiskLevel: string | null;
      symptomNames: string[];
    },
    requestedType?: InsightType,
  ): {
    type: InsightType;
    title: string;
    content: string;
    relevanceScore: number;
    metadata: Record<string, unknown>;
  } {
    const type =
      requestedType ??
      (context.predictionProbability !== null &&
      context.predictionProbability >= 0.6
        ? InsightType.CRISIS_RISK
        : InsightType.RECOMMENDATION);

    const keyDrivers: string[] = [];

    if (context.sleepHours !== null && context.sleepHours < 6) {
      keyDrivers.push('reduced sleep');
    }
    if (context.stressLevel >= 7) {
      keyDrivers.push('high stress');
    }
    if (context.painLevel >= 7) {
      keyDrivers.push('elevated pain');
    }
    if (context.fatigueLevel >= 7) {
      keyDrivers.push('significant fatigue');
    }

    const driversText =
      keyDrivers.length > 0 ? keyDrivers.join(', ') : 'stable daily patterns';
    const probabilityPercent = context.predictionProbability
      ? Math.round(context.predictionProbability * 100)
      : null;

    const title =
      type === InsightType.CRISIS_RISK
        ? 'AI flare-risk insight'
        : type === InsightType.BEHAVIORAL_PATTERN
          ? 'AI behavior pattern insight'
          : type === InsightType.DAILY_SUMMARY
            ? 'AI daily summary'
            : 'AI recommendation insight';

    const content =
      type === InsightType.CRISIS_RISK && probabilityPercent !== null
        ? `The latest analysis suggests a ${probabilityPercent}% chance of a flare in the next 24 hours, driven mainly by ${driversText}. Consider reducing exertion and protecting recovery time today.`
        : type === InsightType.BEHAVIORAL_PATTERN
          ? `Recent records show a pattern influenced by ${driversText}. Keeping sleep, stress and pacing more consistent may help reduce symptom volatility.`
          : type === InsightType.DAILY_SUMMARY
            ? `Today’s summary shows pain at ${context.painLevel}/10, fatigue at ${context.fatigueLevel}/10 and stress at ${context.stressLevel}/10, with recurring symptoms including ${context.symptomNames.slice(0, 3).join(', ') || 'core fibromyalgia markers'}.`
            : `The current pattern is shaped by ${driversText}. Focus on pacing, hydration, restorative sleep and symptom monitoring to lower the chance of escalation.`;

    return {
      type,
      title,
      content,
      relevanceScore: Number(
        (
          context.predictionProbability ??
          Math.min((context.painLevel + context.fatigueLevel) / 20, 0.95)
        ).toFixed(4),
      ),
      metadata: {
        drivers: keyDrivers,
        predictionRiskLevel: context.predictionRiskLevel,
        symptomNames: context.symptomNames,
      },
    };
  }
}
