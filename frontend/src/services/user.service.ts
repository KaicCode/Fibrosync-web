import { api } from './api';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  birthDate?: string | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  countryCode?: string | null;
  timezone: string;
  role: string;
  onboardingCompleted: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/me');
    return response.data;
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.patch<UserProfile>('/users/me', data);
    return response.data;
  },
};
