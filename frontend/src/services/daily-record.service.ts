import { api } from './api';

export interface DailyRecord {
  id: string;
  userId: string;
  date: string;
  painLevel: number;
  fatigueLevel: number;
  sleepQuality: number;
  mood: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyRecordDto {
  date: string;
  painLevel: number;
  fatigueLevel: number;
  sleepQuality: number;
  mood: string;
  notes?: string;
  symptoms?: string[];
}

export const dailyRecordService = {
  getDailyRecords: async (): Promise<DailyRecord[]> => {
    const response = await api.get<DailyRecord[]>('/daily-records');
    return response.data;
  },

  createDailyRecord: async (data: CreateDailyRecordDto): Promise<DailyRecord> => {
    const response = await api.post<DailyRecord>('/daily-records', data);
    return response.data;
  },

  updateDailyRecord: async (id: string, data: Partial<CreateDailyRecordDto>): Promise<DailyRecord> => {
    const response = await api.patch<DailyRecord>(`/daily-records/${id}`, data);
    return response.data;
  },

  deleteDailyRecord: async (id: string): Promise<void> => {
    await api.delete(`/daily-records/${id}`);
  },
};
