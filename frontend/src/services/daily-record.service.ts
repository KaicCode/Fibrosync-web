import { apiCall } from "@/lib/api-client";
import type { WeatherData } from "@/services/weather.service";

export interface DailyRecordSymptomSignal {
  fatigueLevel: number;
  sleepQuality: number;
  stiffness: number;
  mood: number;
  stress: number;
  cognitiveFog: boolean;
  cognitiveFogLevel?: number | null;
  sensitivityLight: boolean;
  sensitivityLightLevel?: number | null;
  sensitivityNoise: boolean;
  sensitivityNoiseLevel?: number | null;
  digestiveIssues: boolean;
  digestiveIssuesLevel?: number | null;
  headache: boolean;
  headacheLevel?: number | null;
  anxiety: boolean;
  anxietyLevel?: number | null;
  depression: boolean;
  depressionLevel?: number | null;
  bodyTemperatureFeeling?: string | null;
  notes?: string | null;
}

export interface DailyRecordSymptomEntry {
  id: string;
  symptomId: string;
  symptomName: string;
  severity: number;
  durationMinutes?: number | null;
  notes?: string | null;
}

export interface DailyRecord {
  id: string;
  recordDate: string;
  painLevel: number;
  sleepHours: number | null;
  sleepQuality: number | null;
  fatigueLevel: number;
  mood: number;
  moodLevel: number;
  stressLevel: number;
  physicalActivity: number | null;
  medicationTaken: boolean | null;
  hydration: number | null;
  weatherFeeling: string | null;
  weatherImpact: string | null;
  weatherSnapshot: WeatherData | null;
  notes: string | null;
  painType: string | null;
  painAreas: string[];
  frontPainAreas: string[];
  backPainAreas: string[];
  painTriggers: string[];
  derivedSignals: boolean;
  dataReliabilityScore: number;
  dataReliabilityLabel: string;
  symptomSignal: DailyRecordSymptomSignal | null;
  symptomEntries: DailyRecordSymptomEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SymptomSignalPayload {
  stiffness?: number;
  cognitiveFog?: boolean;
  cognitiveFogLevel?: number | null;
  headache?: boolean;
  headacheLevel?: number | null;
  digestiveIssues?: boolean;
  digestiveIssuesLevel?: number | null;
  anxiety?: boolean;
  anxietyLevel?: number | null;
  depression?: boolean;
  depressionLevel?: number | null;
  sensitivityLight?: boolean;
  sensitivityLightLevel?: number | null;
  sensitivityNoise?: boolean;
  sensitivityNoiseLevel?: number | null;
  bodyTemperatureFeeling?: string;
  notes?: string;
}

export interface CreateDailyRecordDto {
  recordDate: string;
  painLevel: number;
  sleepHours: number;
  sleepQuality: number;
  fatigueLevel: number;
  moodLevel: number;
  stressLevel: number;
  physicalActivityMinutes?: number;
  hydration?: number;
  medicationTaken?: boolean;
  weatherFeeling?: string;
  weatherImpact?: string;
  weatherSnapshot?: WeatherData;
  notes?: string;
  painType?: string;
  painAreas?: string[];
  frontPainAreas?: string[];
  backPainAreas?: string[];
  painTriggers?: string[];
  symptomSignal?: SymptomSignalPayload;
}

interface DailyRecordListResponse {
  items: DailyRecord[];
}

export interface DailyRecordFilters {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  includeAll?: boolean;
}

export const dailyRecordService = {
  getDailyRecords: async (
    filters?: DailyRecordFilters,
  ): Promise<DailyRecord[]> => {
    const response = await apiCall<DailyRecordListResponse>(
      "get",
      "/daily-records",
      undefined,
      {
        params: filters,
      },
    );
    return response.items;
  },

  createDailyRecord: async (
    data: CreateDailyRecordDto,
  ): Promise<DailyRecord> => {
    return apiCall<DailyRecord>("post", "/daily-records", data);
  },

  updateDailyRecord: async (
    id: string,
    data: Partial<CreateDailyRecordDto>,
  ): Promise<DailyRecord> => {
    return apiCall<DailyRecord>("patch", `/daily-records/${id}`, data);
  },

  deleteDailyRecord: async (id: string): Promise<void> => {
    await apiCall<void>("delete", `/daily-records/${id}`);
  },
};
