import { api } from './api';

export interface Prediction {
  id: string;
  userId: string;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
  suggestedActions: string[];
  createdAt: string;
}

export const predictionService = {
  getLatestPrediction: async (): Promise<Prediction> => {
    const response = await api.get<Prediction>('/prediction/latest');
    return response.data;
  },

  getPredictionHistory: async (): Promise<Prediction[]> => {
    const response = await api.get<Prediction[]>('/prediction/history');
    return response.data;
  },

  requestNewPrediction: async (): Promise<Prediction> => {
    const response = await api.post<Prediction>('/ai/predict');
    return response.data;
  },
};
