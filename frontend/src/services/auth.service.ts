import { apiCall } from '@/lib/api-client';
import { clearStoredAuthTokens } from '@/lib/auth-session';
import type { UserProfile } from './user.service';

const INITIAL_AUTH_TIMEOUT_MS = 45000;

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
  // F-14: the refresh token is no longer part of the response body — the
  // backend sets it as an httpOnly cookie instead.
  tokenType: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
  user: UserProfile;
}

export const authService = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    return apiCall<AuthResponse>('post', '/auth/login', data, {
      timeout: INITIAL_AUTH_TIMEOUT_MS,
    });
  },

  signup: async (data: SignupDto): Promise<AuthResponse> => {
    return apiCall<AuthResponse>('post', '/auth/signup', data, {
      timeout: INITIAL_AUTH_TIMEOUT_MS,
    });
  },

  logout: async (): Promise<void> => {
    // F-14: the refresh token is never sent by the client — the backend
    // reads it from the httpOnly cookie and clears that cookie itself.
    try {
      await apiCall<void>('post', '/auth/logout');
    } finally {
      clearStoredAuthTokens();
    }
  },
};
