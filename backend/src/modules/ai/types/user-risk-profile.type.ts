export interface PersonalizedWeight {
  key: string;
  label: string;
  defaultWeight: number;
  personalizedWeight: number;
  overallOccurrenceRate: number;
  precursorOccurrenceRate: number;
  evidenceCount: number;
  lift: number;
  activeOnLatestDay: boolean;
}

export interface TriggerPattern {
  key: string;
  label: string;
  description: string;
  matchedFeatureKeys: string[];
  occurrenceRateBeforeCrisis: number;
  evidenceCount: number;
  strength: 'MEDIUM' | 'HIGH';
}

export interface UserRiskProfileSnapshot {
  id: string;
  analysisWindowDays: number;
  currentPersonalizedScore: number;
  baselineScore: number;
  lastCrisisSignalCount: number;
  summary: string | null;
  triggerPatterns: TriggerPattern[];
  personalizedWeights: PersonalizedWeight[];
  sourceWindowStart: string;
  sourceWindowEnd: string;
  lastAnalyzedAt: string;
  createdAt: string;
  updatedAt: string;
}
