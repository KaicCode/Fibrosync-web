import { apiCall } from '@/lib/api-client';
import {
  clearStoredAuthTokens,
  getStoredRefreshToken,
} from '@/lib/auth-session';
import type { UserProfile } from './user.service';

export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  fullName: string;
  email: string;
  password: string;
  birthDate?: string;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  countryCode?: string;
  timezone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
  user: UserProfile;
}

export const authService = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    return apiCall<AuthResponse>('post', '/auth/login', data);
  },

  signup: async (data: SignupDto): Promise<AuthResponse> => {
    return apiCall<AuthResponse>('post', '/auth/signup', data);
  },

  logout: async (): Promise<void> => {
    const refreshToken = getStoredRefreshToken();

    try {
      await apiCall<void>(
        'post',
        '/auth/logout',
        refreshToken ? { refreshToken } : undefined,
      );
    } finally {
      clearStoredAuthTokens();
    }
  },
};
