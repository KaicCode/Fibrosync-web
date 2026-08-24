import { api } from './api';
import type { AccountStatus, ApiUserRole } from '@/lib/user-role';

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
  role: ApiUserRole;
  accountStatus: AccountStatus;
  specialty?: string | null;
  professionalCouncilType?: string | null;
  professionalCouncilNumber?: string | null;
  professionalCouncilState?: string | null;
  professionalPhone?: string | null;
  professionalClinic?: string | null;
  professionalBio?: string | null;
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
