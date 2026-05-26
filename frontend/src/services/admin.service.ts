import { api } from './api';

export interface DashboardAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalRecords: number;
  systemHealth: string;
}

export const adminService = {
  getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
    const response = await api.get<DashboardAnalytics>('/analytics/dashboard');
    return response.data;
  },

  getUsers: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/admin/users');
    return response.data;
  },
};
