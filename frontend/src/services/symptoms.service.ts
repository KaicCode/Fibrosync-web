import { api } from './api';

export interface Symptom {
  id: string;
  name: string;
  intensity: number;
  duration?: string;
  trigger?: string;
  dailyRecordId?: string;
  createdAt: string;
}

export interface CreateSymptomDto {
  name: string;
  intensity: number;
  duration?: string;
  trigger?: string;
  dailyRecordId?: string;
}

export const symptomsService = {
  getSymptoms: async (): Promise<Symptom[]> => {
    const response = await api.get<Symptom[]>('/symptoms');
    return response.data;
  },

  addSymptom: async (data: CreateSymptomDto): Promise<Symptom> => {
    const response = await api.post<Symptom>('/symptoms', data);
    return response.data;
  },

  updateSymptom: async (id: string, data: Partial<CreateSymptomDto>): Promise<Symptom> => {
    const response = await api.patch<Symptom>(`/symptoms/${id}`, data);
    return response.data;
  },

  deleteSymptom: async (id: string): Promise<void> => {
    await api.delete(`/symptoms/${id}`);
  },
};
