import { api } from './api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
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
