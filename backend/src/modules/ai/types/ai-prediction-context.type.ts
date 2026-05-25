import type { RiskLevel } from '@prisma/client';
import type { UserRiskProfileSnapshot } from './user-risk-profile.type';

export interface AiPredictionDailyRecordSnapshot {
  id: string;
  recordDate: string;
  sleepHours: number | null;
  sleepQuality: number | null;
  fatigueLevel: number;
  mood: number;
  stressLevel: number;
  physicalActivity: number | null;
  hydration: number | null;
  weatherFeeling: string | null;
  medicationTaken: boolean | null;
  notes: string | null;
  createdAt: string;
}

export interface AiPredictionSymptomSignalSnapshot {
  id: string;
  createdAt: string;
  fatigueLevel: number;
  sleepQuality: number;
  stiffness: number;
  mood: number;
  stress: number;
  cognitiveFog: boolean;
  sensitivityLight: boolean;
  sensitivityNoise: boolean;
  digestiveIssues: boolean;
  headache: boolean;
  anxiety: boolean;
  depression: boolean;
  bodyTemperatureFeeling: string | null;
  notes: string | null;
}

export interface AiPredictionSummary {
  dailyRecordCount: number;
  symptomSignalCount: number;
  averageSleepHours: number | null;
  averageSleepQuality: number | null;
  averageFatigueLevel: number | null;
  averageMood: number | null;
  averageStressLevel: number | null;
  averagePhysicalActivity: number | null;
  averageHydration: number | null;
  medicationTakenRate: number | null;
  lowSleepDays: number;
  highFatigueDays: number;
  highStressDays: number;
  indirectSymptomCounts: Record<string, number>;
  dominantWeatherFeelings: string[];
  dominantTemperatureFeelings: string[];
  repeatedCycles: string[];
}

export interface LatestRuleBasedPredictionSnapshot {
  predictedFor: string;
  probabilityScore: number;
  riskLevel: RiskLevel;
  recommendationSummary: string | null;
}

export interface AiPredictionContext {
  generatedAt: string;
  lookbackDays: number;
  promptVersion: string;
  latestDailyRecordId?: string;
  dailyRecords: AiPredictionDailyRecordSnapshot[];
  symptomSignals: AiPredictionSymptomSignalSnapshot[];
  latestRuleBasedPrediction?: LatestRuleBasedPredictionSnapshot;
  summary: AiPredictionSummary;
  userRiskProfile: UserRiskProfileSnapshot;
}
