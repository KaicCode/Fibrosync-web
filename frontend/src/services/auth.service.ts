import { apiCall } from '@/lib/api-client';

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
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export const authService = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    return apiCall<AuthResponse>('post', '/auth/login', data);
  },

  signup: async (data: SignupDto): Promise<AuthResponse> => {
    return apiCall<AuthResponse>('post', '/auth/signup', data);
  },

  logout: async (): Promise<void> => {
    try {
      await apiCall<void>('post', '/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },
};
