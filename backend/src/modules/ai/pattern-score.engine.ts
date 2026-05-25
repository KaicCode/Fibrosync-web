import { Injectable } from '@nestjs/common';
import type { PatternAnalysisDay } from './types/pattern-analysis-day.type';
import type {
  PersonalizedWeight,
  TriggerPattern,
} from './types/user-risk-profile.type';

interface FeatureDefinition {
  key: FeatureKey;
  label: string;
  defaultWeight: number;
}

type FeatureKey =
  | 'sleepUnder5h'
  | 'poorSleepQuality'
  | 'highFatigue'
  | 'highStress'
  | 'lowMood'
  | 'coldWeather'
  | 'lowHydration'
  | 'lowPhysicalActivity'
  | 'skippedMedication'
  | 'highStiffness'
  | 'cognitiveFog'
  | 'sensorySensitivity'
  | 'digestiveIssues'
  | 'headache'
  | 'anxiety'
  | 'depression';

const featureDefinitions: FeatureDefinition[] = [
  { key: 'sleepUnder5h', label: 'Sleep under 5h', defaultWeight: 18 },
  { key: 'poorSleepQuality', label: 'Poor sleep quality', defaultWeight: 9 },
  { key: 'highFatigue', label: 'High fatigue', defaultWeight: 15 },
  { key: 'highStress', label: 'High stress', defaultWeight: 16 },
  { key: 'lowMood', label: 'Low mood', defaultWeight: 11 },
  { key: 'coldWeather', label: 'Cold weather sensitivity', defaultWeight: 10 },
  { key: 'lowHydration', label: 'Low hydration', defaultWeight: 12 },
  {
    key: 'lowPhysicalActivity',
    label: 'Low physical activity',
    defaultWeight: 6,
  },
  {
    key: 'skippedMedication',
    label: 'Medication not taken',
    defaultWeight: 8,
  },
  { key: 'highStiffness', label: 'High stiffness', defaultWeight: 10 },
  { key: 'cognitiveFog', label: 'Cognitive fog', defaultWeight: 8 },
  {
    key: 'sensorySensitivity',
    label: 'Light or noise sensitivity',
    defaultWeight: 7,
  },
  { key: 'digestiveIssues', label: 'Digestive issues', defaultWeight: 6 },
  { key: 'headache', label: 'Headache', defaultWeight: 5 },
  { key: 'anxiety', label: 'Anxiety', defaultWeight: 7 },
  { key: 'depression', label: 'Depression', defaultWeight: 7 },
];

interface PatternScoreEngineResult {
  currentPersonalizedScore: number;
  baselineScore: number;
  lastCrisisSignalCount: number;
  summary: string;
  triggerPatterns: TriggerPattern[];
  personalizedWeights: PersonalizedWeight[];
}

@Injectable()
export class PatternScoreEngine {
  analyze(days: PatternAnalysisDay[]): PatternScoreEngineResult {
    const sortedDays = [...days].sort((left, right) =>
      left.date.localeCompare(right.date),
    );
    const latestDay = sortedDays.at(-1) ?? null;
    const precursorDays = sortedDays.filter((day) => day.isPrecursorDay);
    const totalDays = sortedDays.length;

    const personalizedWeights = featureDefinitions.map((feature) =>
      this.buildWeight(
        feature,
        sortedDays,
        precursorDays,
        latestDay,
        totalDays,
      ),
    );

    const activeWeightSum = personalizedWeights.reduce(
      (sum, feature) => sum + feature.personalizedWeight,
      0,
    );
    const currentPersonalizedScore =
      latestDay !== null
        ? this.calculateDayScore(
            latestDay,
            personalizedWeights,
            activeWeightSum,
          )
        : 0;

    const baselineScore =
      sortedDays.length > 0
        ? Math.round(
            sortedDays.reduce(
              (sum, day) =>
                sum +
                this.calculateDayScore(
                  day,
                  personalizedWeights,
                  activeWeightSum,
                ),
              0,
            ) / sortedDays.length,
          )
        : 0;

    const triggerPatterns = this.buildTriggerPatterns(
      sortedDays,
      precursorDays,
      personalizedWeights,
    );
    const summary = this.buildSummary(triggerPatterns, precursorDays.length);

    return {
      currentPersonalizedScore,
      baselineScore,
      lastCrisisSignalCount: precursorDays.length,
      summary,
      triggerPatterns,
      personalizedWeights,
    };
  }

  private buildWeight(
    feature: FeatureDefinition,
    days: PatternAnalysisDay[],
    precursorDays: PatternAnalysisDay[],
    latestDay: PatternAnalysisDay | null,
    totalDays: number,
  ): PersonalizedWeight {
    const overallCount = days.filter((day) =>
      this.isFeatureActive(day, feature.key),
    ).length;
    const precursorCount = precursorDays.filter((day) =>
      this.isFeatureActive(day, feature.key),
    ).length;
    const overallOccurrenceRate = totalDays > 0 ? overallCount / totalDays : 0;
    const precursorOccurrenceRate =
      precursorDays.length > 0 ? precursorCount / precursorDays.length : 0;
    const lift =
      overallOccurrenceRate > 0
        ? precursorOccurrenceRate / overallOccurrenceRate
        : precursorCount > 0
          ? 2
          : 1;
    const confidenceFactor =
      precursorDays.length > 0
        ? Math.min(1, precursorCount / Math.max(precursorDays.length, 1))
        : 0;
    const enrichment = Math.max(
      0,
      precursorOccurrenceRate - overallOccurrenceRate,
    );
    const suppression = Math.max(
      0,
      overallOccurrenceRate - precursorOccurrenceRate,
    );

    const adjustedWeight =
      precursorDays.length === 0
        ? feature.defaultWeight
        : feature.defaultWeight *
          (1 + enrichment * 1.8 + Math.max(0, lift - 1) * 0.35) *
          (1 - suppression * 0.2) *
          (0.8 + confidenceFactor * 0.2);

    const personalizedWeight = Number(
      Math.min(
        Math.max(adjustedWeight, feature.defaultWeight * 0.65),
        feature.defaultWeight * 2.4,
      ).toFixed(2),
    );

    return {
      key: feature.key,
      label: feature.label,
      defaultWeight: feature.defaultWeight,
      personalizedWeight,
      overallOccurrenceRate: Number(overallOccurrenceRate.toFixed(4)),
      precursorOccurrenceRate: Number(precursorOccurrenceRate.toFixed(4)),
      evidenceCount: precursorCount,
      lift: Number(lift.toFixed(4)),
      activeOnLatestDay:
        latestDay !== null && this.isFeatureActive(latestDay, feature.key),
    };
  }

  private buildTriggerPatterns(
    days: PatternAnalysisDay[],
    precursorDays: PatternAnalysisDay[],
    personalizedWeights: PersonalizedWeight[],
  ): TriggerPattern[] {
    if (precursorDays.length === 0) {
      return [];
    }

    const weightMap = new Map(
      personalizedWeights.map((feature) => [feature.key, feature]),
    );

    const singleFeaturePatterns = personalizedWeights
      .filter(
        (feature) =>
          feature.evidenceCount >= 2 &&
          feature.precursorOccurrenceRate >= 0.55 &&
          feature.personalizedWeight >= feature.defaultWeight * 1.05,
      )
      .map<TriggerPattern>((feature) => ({
        key: `feature:${feature.key}`,
        label: feature.label,
        description: `${feature.label} showed up before stronger crisis signals in ${feature.evidenceCount} recent observation${this.pluralSuffix(
          feature.evidenceCount,
        )}.`,
        matchedFeatureKeys: [feature.key],
        occurrenceRateBeforeCrisis: feature.precursorOccurrenceRate,
        evidenceCount: feature.evidenceCount,
        strength: feature.precursorOccurrenceRate >= 0.75 ? 'HIGH' : 'MEDIUM',
      }));

    const pairDefinitions: Array<{
      key: string;
      label: string;
      description: string;
      features: [FeatureKey, FeatureKey];
    }> = [
      {
        key: 'pair:sleepUnder5h-highStress',
        label: 'Short sleep plus high stress',
        description:
          'Sleeping under 5 hours combined with high stress repeated before crisis signals.',
        features: ['sleepUnder5h', 'highStress'],
      },
      {
        key: 'pair:sleepUnder5h-lowHydration',
        label: 'Short sleep plus low hydration',
        description:
          'Short sleep and low hydration appeared together before crisis signals.',
        features: ['sleepUnder5h', 'lowHydration'],
      },
      {
        key: 'pair:coldWeather-lowHydration',
        label: 'Cold weather plus low hydration',
        description:
          'Cold-weather discomfort with low hydration repeated before crisis signals.',
        features: ['coldWeather', 'lowHydration'],
      },
      {
        key: 'pair:highStress-lowMood',
        label: 'High stress plus low mood',
        description:
          'High stress and lower mood tended to cluster before crisis signals.',
        features: ['highStress', 'lowMood'],
      },
      {
        key: 'pair:highFatigue-cognitiveFog',
        label: 'High fatigue plus cognitive fog',
        description:
          'High fatigue with cognitive fog repeated before crisis signals.',
        features: ['highFatigue', 'cognitiveFog'],
      },
      {
        key: 'pair:poorSleepQuality-highStress',
        label: 'Poor sleep quality plus high stress',
        description:
          'Poor sleep quality and high stress often appeared together before crisis signals.',
        features: ['poorSleepQuality', 'highStress'],
      },
    ];

    const pairPatterns = pairDefinitions.flatMap<TriggerPattern>(
      (definition) => {
        const evidenceCount = precursorDays.filter(
          (day) =>
            this.isFeatureActive(day, definition.features[0]) &&
            this.isFeatureActive(day, definition.features[1]),
        ).length;
        const occurrenceRateBeforeCrisis = evidenceCount / precursorDays.length;
        const weightedSupport =
          (weightMap.get(definition.features[0])?.personalizedWeight ?? 0) +
          (weightMap.get(definition.features[1])?.personalizedWeight ?? 0);

        if (
          evidenceCount < 2 ||
          occurrenceRateBeforeCrisis < 0.4 ||
          weightedSupport < 18
        ) {
          return [];
        }

        return [
          {
            key: definition.key,
            label: definition.label,
            description: definition.description,
            matchedFeatureKeys: [...definition.features],
            occurrenceRateBeforeCrisis: Number(
              occurrenceRateBeforeCrisis.toFixed(4),
            ),
            evidenceCount,
            strength: occurrenceRateBeforeCrisis >= 0.6 ? 'HIGH' : 'MEDIUM',
          },
        ];
      },
    );

    const patterns = [...singleFeaturePatterns, ...pairPatterns];

    return patterns
      .sort(
        (left, right) =>
          right.occurrenceRateBeforeCrisis - left.occurrenceRateBeforeCrisis ||
          right.evidenceCount - left.evidenceCount ||
          left.label.localeCompare(right.label),
      )
      .slice(0, 8);
  }

  private buildSummary(
    triggerPatterns: TriggerPattern[],
    precursorDayCount: number,
  ): string {
    if (precursorDayCount === 0) {
      return 'No strong pre-crisis repetition was detected in the last 30 days yet. The personalized profile remains close to baseline and will adapt as more data is collected.';
    }

    if (triggerPatterns.length === 0) {
      return `The user showed ${precursorDayCount} recent crisis precursor observation${this.pluralSuffix(
        precursorDayCount,
      )}, but no stable repeated trigger stood out strongly enough yet.`;
    }

    const topLabels = triggerPatterns
      .slice(0, 3)
      .map((pattern) => pattern.label);

    return `The strongest repeated pre-crisis patterns in the recent tracking window are ${topLabels.join(', ')}.`;
  }

  private calculateDayScore(
    day: PatternAnalysisDay,
    personalizedWeights: PersonalizedWeight[],
    activeWeightSum: number,
  ): number {
    if (activeWeightSum <= 0) {
      return 0;
    }

    const activeScore = personalizedWeights.reduce((sum, feature) => {
      if (!this.isFeatureActive(day, feature.key as FeatureKey)) {
        return sum;
      }

      return sum + feature.personalizedWeight;
    }, 0);

    return Math.min(
      Math.max(Math.round((activeScore / activeWeightSum) * 100), 0),
      100,
    );
  }

  private isFeatureActive(day: PatternAnalysisDay, key: FeatureKey): boolean {
    switch (key) {
      case 'sleepUnder5h':
        return day.sleepHours !== null && day.sleepHours < 5;
      case 'poorSleepQuality':
        return day.sleepQuality !== null && day.sleepQuality <= 4;
      case 'highFatigue':
        return day.fatigueLevel !== null && day.fatigueLevel >= 7;
      case 'highStress':
        return day.stressLevel !== null && day.stressLevel >= 7;
      case 'lowMood':
        return day.mood !== null && day.mood <= 4;
      case 'coldWeather':
        return this.isColdFeeling(
          day.weatherFeeling,
          day.bodyTemperatureFeelings,
        );
      case 'lowHydration':
        return day.hydration !== null && day.hydration < 1.5;
      case 'lowPhysicalActivity':
        return day.physicalActivity !== null && day.physicalActivity < 20;
      case 'skippedMedication':
        return day.medicationTaken === false;
      case 'highStiffness':
        return day.stiffness !== null && day.stiffness >= 7;
      case 'cognitiveFog':
        return day.cognitiveFog;
      case 'sensorySensitivity':
        return day.sensitivityLight || day.sensitivityNoise;
      case 'digestiveIssues':
        return day.digestiveIssues;
      case 'headache':
        return day.headache;
      case 'anxiety':
        return day.anxiety;
      case 'depression':
        return day.depression;
    }
  }

  private isColdFeeling(
    weatherFeeling: string | null,
    bodyTemperatureFeelings: string[],
  ): boolean {
    const values = [weatherFeeling, ...bodyTemperatureFeelings]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.trim().toLowerCase());

    return values.some((value) =>
      [
        'cold',
        'frio',
        'gelado',
        'gelada',
        'chilly',
        'freezing',
        'cold front',
      ].some((keyword) => value.includes(keyword)),
    );
  }

  private pluralSuffix(value: number): string {
    return value === 1 ? '' : 's';
  }
}
