import { apiCall } from "@/lib/api-client";
import type { WeatherData } from "@/services/weather.service";

export interface DailyRecord {
  id: string;
  recordDate: string;
  painLevel: number;
  sleepHours?: number | null;
  sleepQuality?: number | null;
  fatigueLevel: number;
  mood: number;
  stressLevel: number;
  physicalActivity?: number | null;
  medicationTaken?: boolean | null;
  hydration?: number | null;
  weatherFeeling?: string | null;
  weatherImpact?: string | null;
  weatherSnapshot?: WeatherData | null;
  notes?: string | null;
  painType?: string | null;
  painAreas: string[];
  painTriggers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyRecordDto {
  recordDate?: string;
  painLevel?: number;
  sleepHours?: number;
  sleepQuality?: number;
  fatigueLevel: number;
  mood: number;
  stressLevel: number;
  physicalActivity?: number;
  hydration?: number;
  medicationTaken?: boolean;
  weatherFeeling?: string;
  weatherImpact?: string;
  weatherSnapshot?: WeatherData;
  notes?: string;
  painType?: string;
  painAreas?: string[];
  painTriggers?: string[];
}

interface DailyRecordListResponse {
  items: DailyRecord[];
}

export interface DailyRecordFilters {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
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
