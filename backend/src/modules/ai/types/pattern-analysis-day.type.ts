export interface PatternAnalysisDay {
  date: string;
  sleepHours: number | null;
  sleepQuality: number | null;
  fatigueLevel: number | null;
  mood: number | null;
  stressLevel: number | null;
  physicalActivity: number | null;
  hydration: number | null;
  medicationTaken: boolean | null;
  weatherFeeling: string | null;
  bodyTemperatureFeelings: string[];
  stiffness: number | null;
  cognitiveFog: boolean;
  sensitivityLight: boolean;
  sensitivityNoise: boolean;
  digestiveIssues: boolean;
  headache: boolean;
  anxiety: boolean;
  depression: boolean;
  riskProbability: number | null;
  riskLevel: string | null;
  isPrecursorDay: boolean;
}
