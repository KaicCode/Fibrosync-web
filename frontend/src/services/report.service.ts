import { api } from './api';

export interface ReportData {
  period: string;
  summary: any;
  charts: any;
}

export const reportService = {
  getSummary: async (): Promise<any> => {
    const response = await api.get('/reports/summary');
    return response.data;
  },

  generateReport: async (period: 'weekly' | 'monthly' | 'quarterly'): Promise<ReportData> => {
    const response = await api.get<ReportData>(`/reports/generate?period=${period}`);
    return response.data;
  },
};
