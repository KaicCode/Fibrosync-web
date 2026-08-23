export type AdminAnalyticsPeriod = {
  startDate: string;
  endDate: string;
  days: number;
};

export type AdminAnalyticsSummary = {
  totalRecords: number;
  patientsWithRecords: number;
  triggerTypes: number;
  analysesGenerated: number;
  ruleEngineAnalyses: number;
  aiAnalyses: number;
};

export type AdminAnalyticsTriggerItem = {
  label: string;
  count: number;
  percentageOfRecords: number | null;
};

export type AdminAnalyticsSymptomItem = {
  label: string;
  frequency: number;
  percentageOfRecords: number | null;
  averageIntensity: number | null;
  intensitySampleSize: number;
};

export type AdminAnalyticsCooccurrenceItem = {
  labels: [string, string];
  label: string;
  count: number;
  percentageOfRecords: number | null;
};

export type AdminAnalyticsHistoryPoint = {
  date: string;
  ruleEngineCount: number;
  aiCount: number;
  totalCount: number;
};

export type AdminAnalyticsMethodology = {
  cooccurrenceMinimumRecords: number;
  intensityUsesOnlyNumericValues: true;
  analysisHistoryBasedOn: 'createdAt';
};

export type AdminAnalyticsResponse = {
  generatedAt: string;
  period: AdminAnalyticsPeriod;
  summary: AdminAnalyticsSummary;
  triggers: AdminAnalyticsTriggerItem[];
  symptoms: AdminAnalyticsSymptomItem[];
  cooccurrences: AdminAnalyticsCooccurrenceItem[];
  analysisHistory: AdminAnalyticsHistoryPoint[];
  methodology: AdminAnalyticsMethodology;
};
