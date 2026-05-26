import { api } from './api';

export type ReportPeriod = 'weekly' | 'monthly' | 'quarterly';
export type ReportTrend = 'improving' | 'stable' | 'worsening';

export interface ReportMetricPoint {
  date: string;
  value: number;
}

export interface ReportMetricEvolution {
  average: number;
  min: number | null;
  max: number | null;
  latest: number | null;
  change: number;
  trend: ReportTrend;
  series: ReportMetricPoint[];
}

export interface ReportPatternItem {
  label: string;
  occurrences: number;
  percentage: number;
}

export interface ReportRecurringTrigger {
  key: string;
  label: string;
  source: string;
  occurrences: number;
  occurrenceRate: number;
  highRiskOccurrences: number;
  highRiskRate: number;
  evidence: string;
}

export interface ReportProbabilityPoint {
  date: string;
  ruleBasedProbabilityScore: number | null;
  aiProbabilityScore: number | null;
  combinedProbabilityScore: number | null;
  highestSource: string | null;
}

export interface ReportCorrelation {
  key: string;
  leftMetric: string;
  rightMetric: string;
  coefficient: number;
  direction: 'positive' | 'negative' | 'none';
  strength: 'weak' | 'moderate' | 'strong';
  sampleSize: number;
  insight: string;
}

export interface ReportRiskPattern {
  key: string;
  label: string;
  description: string;
  occurrenceRateBeforeCrisis: number;
  evidenceCount: number;
  strength: 'MEDIUM' | 'HIGH';
}

export interface ReportPersonalizedWeight {
  key: string;
  label: string;
  personalizedWeight: number;
  evidenceCount: number;
  lift: number;
  activeOnLatestDay: boolean;
}

export interface ReportStructuredData {
  metadata: {
    format: string;
    period: ReportPeriod;
    generatedAt: string;
    window: {
      start: string;
      end: string;
      expectedDays: number;
      capturedDays: number;
    };
    pdfExport: {
      readyForFutureGeneration: boolean;
      generated: boolean;
      fileUrl: string | null;
    };
  };
  overview: {
    recordedEntries: number;
    recordedDays: number;
    averagePainLevel: number;
    symptomSignalCount: number;
    rulePredictionCount: number;
    aiPredictionCount: number;
    dataCoverageRate: number;
    averageSleepHours: number;
    averageFatigueLevel: number;
    averageMoodLevel: number;
    averageStressLevel: number;
    averageProbabilityScore: number;
  };
  painEvolution: ReportMetricEvolution;
  sleepEvolution: {
    hours: ReportMetricEvolution;
    quality: ReportMetricEvolution;
  };
  fatigueEvolution: ReportMetricEvolution;
  moodEvolution: ReportMetricEvolution;
  painPatterns: {
    types: ReportPatternItem[];
    areas: ReportPatternItem[];
    triggers: ReportPatternItem[];
  };
  recurringTriggers: ReportRecurringTrigger[];
  crisisProbability: {
    averageProbabilityScore: number;
    maxProbabilityScore: number;
    highRiskDays: number;
    urgentRiskDays: number;
    latestProbabilityScore: number | null;
    latestRiskSource: string | null;
    dailySeries: ReportProbabilityPoint[];
  };
  correlations: ReportCorrelation[];
  personalizedRiskProfile: {
    available: boolean;
    currentPersonalizedScore: number | null;
    baselineScore: number | null;
    summary: string | null;
    lastAnalyzedAt: string | null;
    triggerPatterns: ReportRiskPattern[];
    topWeights: ReportPersonalizedWeight[];
  };
}

export interface ReportResponse {
  id: string;
  period: ReportPeriod;
  status: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
  data: ReportStructuredData | null;
}

export const reportService = {
  generateReport: async (period: ReportPeriod): Promise<ReportResponse> => {
    const response = await api.get<ReportResponse>(`/reports/generate?period=${period}`);
    return response.data;
  },
};
