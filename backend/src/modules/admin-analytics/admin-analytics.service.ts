import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { normalizeText } from '@/common/utils/normalize-text.util';
import { addDays, normalizeDateOnly } from '@/common/utils/date.util';
import { PrismaService } from '@/database/prisma.service';
import type { AdminAnalyticsQueryDto } from './dto/admin-analytics-query.dto';
import type {
  AdminAnalyticsCooccurrenceItem,
  AdminAnalyticsHistoryPoint,
  AdminAnalyticsResponse,
  AdminAnalyticsSymptomItem,
  AdminAnalyticsTriggerItem,
} from './admin-analytics.types';

const DEFAULT_PERIOD_DAYS = 30;
const MAX_TRIGGER_ITEMS = 10;
const MAX_SYMPTOM_ITEMS = 12;
const MAX_COOCCURRENCE_ITEMS = 10;
const MIN_COOCCURRENCE_RECORDS = 5;

const dailyRecordAnalyticsSelect = {
  id: true,
  userId: true,
  painLevel: true,
  fatigueLevel: true,
  painTriggers: true,
} satisfies Prisma.DailyRecordSelect;

const symptomEntryAnalyticsSelect = {
  dailyRecordId: true,
  severity: true,
  symptom: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.SymptomEntrySelect;

const symptomSignalAnalyticsSelect = {
  dailyRecordId: true,
  stiffness: true,
  cognitiveFog: true,
  cognitiveFogLevel: true,
  sensitivityLight: true,
  sensitivityLightLevel: true,
  sensitivityNoise: true,
  sensitivityNoiseLevel: true,
  digestiveIssues: true,
  digestiveIssuesLevel: true,
  headache: true,
  headacheLevel: true,
  anxiety: true,
  anxietyLevel: true,
  depression: true,
  depressionLevel: true,
} satisfies Prisma.SymptomSignalSelect;

type SymptomSignalAnalyticsRow = Prisma.SymptomSignalGetPayload<{
  select: typeof symptomSignalAnalyticsSelect;
}>;

type AnalysisHistoryRow = {
  date: Date;
  ruleEngineCount: number;
  aiCount: number;
};

type RecordSymptomObservation = {
  label: string;
  intensity: number | null;
};

type CooccurrenceAggregate = {
  labels: [string, string];
  count: number;
};

type AnalyticsWindow = {
  startDate: Date;
  endDate: Date;
  endExclusive: Date;
  startDateKey: string;
  endDateKey: string;
  days: number;
};

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(
    query: AdminAnalyticsQueryDto,
  ): Promise<AdminAnalyticsResponse> {
    const window = this.resolveWindow(query.startDate, query.endDate);

    const [
      dailyRecords,
      symptomEntries,
      symptomSignals,
      analysisHistoryRows,
    ] = await Promise.all([
      this.prisma.dailyRecord.findMany({
        where: {
          recordDate: {
            gte: window.startDate,
            lte: window.endDate,
          },
        },
        select: dailyRecordAnalyticsSelect,
      }),
      this.prisma.symptomEntry.findMany({
        where: {
          dailyRecord: {
            recordDate: {
              gte: window.startDate,
              lte: window.endDate,
            },
          },
        },
        select: symptomEntryAnalyticsSelect,
      }),
      this.prisma.symptomSignal.findMany({
        where: {
          dailyRecordId: {
            not: null,
          },
          dailyRecord: {
            recordDate: {
              gte: window.startDate,
              lte: window.endDate,
            },
          },
        },
        select: symptomSignalAnalyticsSelect,
      }),
      this.buildAnalysisHistory(window.startDate, window.endDate, window.endExclusive),
    ]);

    const recordSymptomMap = new Map<string, Map<string, RecordSymptomObservation>>();
    const triggerAggregates = new Map<string, { label: string; count: number }>();
    const patientsWithRecords = new Set<string>();

    for (const record of dailyRecords) {
      patientsWithRecords.add(record.userId);

      this.registerSymptom(recordSymptomMap, record.id, 'Dor', record.painLevel);
      this.registerSymptom(recordSymptomMap, record.id, 'Fadiga', record.fatigueLevel);

      const uniqueTriggers = new Set<string>();

      for (const trigger of record.painTriggers) {
        const normalized = normalizeText(trigger);

        if (!normalized || uniqueTriggers.has(normalized)) {
          continue;
        }

        uniqueTriggers.add(normalized);

        const existing = triggerAggregates.get(normalized);

        if (existing) {
          existing.count += 1;
          continue;
        }

        triggerAggregates.set(normalized, {
          label: this.formatDisplayLabel(trigger),
          count: 1,
        });
      }
    }

    for (const entry of symptomEntries) {
      this.registerSymptom(
        recordSymptomMap,
        entry.dailyRecordId,
        entry.symptom.name,
        entry.severity,
      );
    }

    for (const signal of symptomSignals) {
      if (!signal.dailyRecordId) {
        continue;
      }

      this.registerSignalSymptoms(recordSymptomMap, signal.dailyRecordId, signal);
    }

    const totalRecords = dailyRecords.length;
    const triggers = this.buildTriggerItems(triggerAggregates, totalRecords);
    const symptoms = this.buildSymptomItems(recordSymptomMap, totalRecords);
    const cooccurrences = this.buildCooccurrenceItems(recordSymptomMap, totalRecords);
    const analysisHistory = this.mapAnalysisHistory(analysisHistoryRows);
    const ruleEngineAnalyses = analysisHistory.reduce(
      (sum, point) => sum + point.ruleEngineCount,
      0,
    );
    const aiAnalyses = analysisHistory.reduce(
      (sum, point) => sum + point.aiCount,
      0,
    );

    return {
      generatedAt: new Date().toISOString(),
      period: {
        startDate: window.startDateKey,
        endDate: window.endDateKey,
        days: window.days,
      },
      summary: {
        totalRecords,
        patientsWithRecords: patientsWithRecords.size,
        triggerTypes: triggers.length,
        analysesGenerated: ruleEngineAnalyses + aiAnalyses,
        ruleEngineAnalyses,
        aiAnalyses,
      },
      triggers: triggers.slice(0, MAX_TRIGGER_ITEMS),
      symptoms: symptoms.slice(0, MAX_SYMPTOM_ITEMS),
      cooccurrences: cooccurrences.slice(0, MAX_COOCCURRENCE_ITEMS),
      analysisHistory,
      methodology: {
        cooccurrenceMinimumRecords: MIN_COOCCURRENCE_RECORDS,
        intensityUsesOnlyNumericValues: true,
        analysisHistoryBasedOn: 'createdAt',
      },
    };
  }

  private resolveWindow(startDate?: string, endDate?: string): AnalyticsWindow {
    const resolvedEnd = endDate
      ? normalizeDateOnly(endDate)
      : normalizeDateOnly(new Date());
    const resolvedStart = startDate
      ? normalizeDateOnly(startDate)
      : addDays(resolvedEnd, -(DEFAULT_PERIOD_DAYS - 1));

    if (resolvedStart.getTime() > resolvedEnd.getTime()) {
      throw new BadRequestException(
        'A data inicial deve ser anterior a data final.',
      );
    }

    const endExclusive = addDays(resolvedEnd, 1);
    const days =
      Math.floor(
        (resolvedEnd.getTime() - resolvedStart.getTime()) / 86_400_000,
      ) + 1;

    return {
      startDate: resolvedStart,
      endDate: resolvedEnd,
      endExclusive,
      startDateKey: this.toDateOnly(resolvedStart),
      endDateKey: this.toDateOnly(resolvedEnd),
      days,
    };
  }

  private async buildAnalysisHistory(
    startDate: Date,
    endDate: Date,
    endExclusive: Date,
  ): Promise<AnalysisHistoryRow[]> {
    return this.prisma.$queryRaw<AnalysisHistoryRow[]>(Prisma.sql`
      SELECT
        day::date AS date,
        COALESCE(rule_engine.count, 0)::int AS "ruleEngineCount",
        COALESCE(ai.count, 0)::int AS "aiCount"
      FROM generate_series(${startDate}::date, ${endDate}::date, interval '1 day') AS day
      LEFT JOIN (
        SELECT
          DATE(created_at) AS date,
          COUNT(*)::int AS count
        FROM crisis_predictions
        WHERE created_at >= ${startDate}
          AND created_at < ${endExclusive}
        GROUP BY DATE(created_at)
      ) AS rule_engine
        ON rule_engine.date = day::date
      LEFT JOIN (
        SELECT
          DATE(created_at) AS date,
          COUNT(*)::int AS count
        FROM ai_predictions
        WHERE created_at >= ${startDate}
          AND created_at < ${endExclusive}
        GROUP BY DATE(created_at)
      ) AS ai
        ON ai.date = day::date
      ORDER BY day ASC
    `);
  }

  private registerSignalSymptoms(
    recordSymptomMap: Map<string, Map<string, RecordSymptomObservation>>,
    recordId: string,
    signal: SymptomSignalAnalyticsRow,
  ): void {
    this.registerBooleanSymptom(
      recordSymptomMap,
      recordId,
      'Dificuldade de Concentracao',
      signal.cognitiveFog,
      signal.cognitiveFogLevel,
    );
    this.registerBooleanSymptom(
      recordSymptomMap,
      recordId,
      'Sensibilidade a luz',
      signal.sensitivityLight,
      signal.sensitivityLightLevel,
    );
    this.registerBooleanSymptom(
      recordSymptomMap,
      recordId,
      'Sensibilidade a ruido',
      signal.sensitivityNoise,
      signal.sensitivityNoiseLevel,
    );
    this.registerBooleanSymptom(
      recordSymptomMap,
      recordId,
      'Alteracoes digestivas',
      signal.digestiveIssues,
      signal.digestiveIssuesLevel,
    );
    this.registerBooleanSymptom(
      recordSymptomMap,
      recordId,
      'Dor de cabeca',
      signal.headache,
      signal.headacheLevel,
    );
    this.registerBooleanSymptom(
      recordSymptomMap,
      recordId,
      'Ansiedade',
      signal.anxiety,
      signal.anxietyLevel,
    );
    this.registerBooleanSymptom(
      recordSymptomMap,
      recordId,
      'Humor depressivo',
      signal.depression,
      signal.depressionLevel,
    );
    this.registerSymptom(
      recordSymptomMap,
      recordId,
      'Rigidez corporal',
      signal.stiffness,
    );
  }

  private registerBooleanSymptom(
    recordSymptomMap: Map<string, Map<string, RecordSymptomObservation>>,
    recordId: string,
    label: string,
    flag: boolean,
    level: number | null,
  ): void {
    if (!flag && !this.hasPositiveNumber(level)) {
      return;
    }

    this.registerSymptom(recordSymptomMap, recordId, label, level, {
      allowWithoutIntensity: true,
    });
  }

  private registerSymptom(
    recordSymptomMap: Map<string, Map<string, RecordSymptomObservation>>,
    recordId: string,
    label: string,
    intensity: number | null | undefined,
    options?: {
      allowWithoutIntensity?: boolean;
    },
  ): void {
    const normalized = normalizeText(label);

    if (!normalized) {
      return;
    }

    const recordSymptoms = recordSymptomMap.get(recordId) ?? new Map();
    const existing = recordSymptoms.get(normalized);
    const normalizedIntensity = this.normalizeIntensity(intensity);

    if (!options?.allowWithoutIntensity && normalizedIntensity === null) {
      return;
    }

    recordSymptoms.set(normalized, {
      label: existing?.label ?? this.formatDisplayLabel(label),
      intensity: this.resolveMaxIntensity(existing?.intensity ?? null, normalizedIntensity),
    });

    if (!recordSymptomMap.has(recordId)) {
      recordSymptomMap.set(recordId, recordSymptoms);
    }
  }

  private buildTriggerItems(
    triggerAggregates: Map<string, { label: string; count: number }>,
    totalRecords: number,
  ): AdminAnalyticsTriggerItem[] {
    return [...triggerAggregates.values()]
      .sort(
        (left, right) =>
          right.count - left.count || left.label.localeCompare(right.label, 'pt-BR'),
      )
      .map((item) => ({
        label: item.label,
        count: item.count,
        percentageOfRecords:
          totalRecords > 0 ? this.round((item.count / totalRecords) * 100) : null,
      }));
  }

  private buildSymptomItems(
    recordSymptomMap: Map<string, Map<string, RecordSymptomObservation>>,
    totalRecords: number,
  ): AdminAnalyticsSymptomItem[] {
    const aggregates = new Map<
      string,
      {
        label: string;
        frequency: number;
        intensitySum: number;
        intensityCount: number;
      }
    >();

    for (const recordSymptoms of recordSymptomMap.values()) {
      for (const [key, observation] of recordSymptoms.entries()) {
        const aggregate = aggregates.get(key) ?? {
          label: observation.label,
          frequency: 0,
          intensitySum: 0,
          intensityCount: 0,
        };

        aggregate.frequency += 1;

        if (this.hasPositiveNumber(observation.intensity)) {
          aggregate.intensitySum += observation.intensity;
          aggregate.intensityCount += 1;
        }

        aggregates.set(key, aggregate);
      }
    }

    return [...aggregates.values()]
      .map((aggregate) => ({
        label: aggregate.label,
        frequency: aggregate.frequency,
        percentageOfRecords:
          totalRecords > 0
            ? this.round((aggregate.frequency / totalRecords) * 100)
            : null,
        averageIntensity:
          aggregate.intensityCount > 0
            ? this.round(aggregate.intensitySum / aggregate.intensityCount)
            : null,
        intensitySampleSize: aggregate.intensityCount,
      }))
      .sort(
        (left, right) =>
          right.frequency - left.frequency ||
          (right.averageIntensity ?? -1) - (left.averageIntensity ?? -1) ||
          left.label.localeCompare(right.label, 'pt-BR'),
      );
  }

  private buildCooccurrenceItems(
    recordSymptomMap: Map<string, Map<string, RecordSymptomObservation>>,
    totalRecords: number,
  ): AdminAnalyticsCooccurrenceItem[] {
    const aggregates = new Map<string, CooccurrenceAggregate>();

    for (const recordSymptoms of recordSymptomMap.values()) {
      const labels = [...recordSymptoms.values()]
        .map((item) => item.label)
        .sort((left, right) => left.localeCompare(right, 'pt-BR'));

      if (labels.length < 2) {
        continue;
      }

      for (let leftIndex = 0; leftIndex < labels.length - 1; leftIndex += 1) {
        for (
          let rightIndex = leftIndex + 1;
          rightIndex < labels.length;
          rightIndex += 1
        ) {
          const leftLabel = labels[leftIndex]!;
          const rightLabel = labels[rightIndex]!;
          const key = `${normalizeText(leftLabel)}::${normalizeText(rightLabel)}`;
          const existing = aggregates.get(key);

          if (existing) {
            existing.count += 1;
            continue;
          }

          aggregates.set(key, {
            labels: [leftLabel, rightLabel],
            count: 1,
          });
        }
      }
    }

    return [...aggregates.values()]
      .filter((item) => item.count >= MIN_COOCCURRENCE_RECORDS)
      .sort(
        (left, right) =>
          right.count - left.count ||
          left.labels[0].localeCompare(right.labels[0], 'pt-BR') ||
          left.labels[1].localeCompare(right.labels[1], 'pt-BR'),
      )
      .map((item) => ({
        labels: item.labels,
        label: `${item.labels[0]} + ${item.labels[1]}`,
        count: item.count,
        percentageOfRecords:
          totalRecords > 0 ? this.round((item.count / totalRecords) * 100) : null,
      }));
  }

  private mapAnalysisHistory(rows: AnalysisHistoryRow[]): AdminAnalyticsHistoryPoint[] {
    return rows.map((row) => ({
      date: this.toDateOnly(row.date),
      ruleEngineCount: Number(row.ruleEngineCount) || 0,
      aiCount: Number(row.aiCount) || 0,
      totalCount: (Number(row.ruleEngineCount) || 0) + (Number(row.aiCount) || 0),
    }));
  }

  private resolveMaxIntensity(
    current: number | null,
    incoming: number | null,
  ): number | null {
    if (!this.hasPositiveNumber(incoming)) {
      return current;
    }

    if (!this.hasPositiveNumber(current)) {
      return incoming;
    }

    return Math.max(current, incoming);
  }

  private normalizeIntensity(value: number | null | undefined): number | null {
    if (!this.hasPositiveNumber(value)) {
      return null;
    }

    return Math.round(value * 10) / 10;
  }

  private hasPositiveNumber(value: number | null | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }

  private round(value: number): number {
    return Number(value.toFixed(1));
  }

  private formatDisplayLabel(value: string): string {
    const normalized = value.trim().replace(/\s+/g, ' ');

    if (!normalized) {
      return '';
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private toDateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
