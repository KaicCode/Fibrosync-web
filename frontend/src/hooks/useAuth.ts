import { useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/store/app-store';
import { supabaseSyncService } from '@/services/supabase-sync.service';
import { authService } from '../services/auth.service';
import type { LoginDto, SignupDto } from '../services/auth.service';
import type { UserProfile } from '../services/user.service';

function mapUserToSessionUser(user: UserProfile) {
  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
    fullName: user.fullName,
    birthDate: user.birthDate ?? null,
    gender: user.gender ?? null,
    heightCm: user.heightCm ?? null,
    weightKg: user.weightKg ?? null,
    countryCode: user.countryCode ?? null,
    timezone: user.timezone,
    role: user.role as 'USER' | 'ADMIN',
    onboardingCompleted: user.onboardingCompleted,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } as const
}

export function useAuth() {
  const setAuthSession = useAppStore((state) => state.setAuthSession);
  const clearAuthSession = useAppStore((state) => state.clearAuthSession);

  const loginMutation = useMutation({
    mutationFn: (data: LoginDto) => authService.login(data),
    onSuccess: (data) => {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('access_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('refresh_token', data.refreshToken);
      }
      // Store auth session in Zustand store
      setAuthSession({
        token: data.accessToken,
        user: mapUserToSessionUser(data.user),
      });
      void supabaseSyncService.upsertRecord({
        entityId: data.user.id,
        entityType: 'user-profile',
        userId: data.user.id,
        userEmail: data.user.email,
        payload: data.user as unknown as Record<string, unknown>,
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: SignupDto) => authService.signup(data),
    onSuccess: (data) => {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('access_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('refresh_token', data.refreshToken);
      }
      // Store auth session in Zustand store
      setAuthSession({
        token: data.accessToken,
        user: mapUserToSessionUser(data.user),
      });
      void supabaseSyncService.upsertRecord({
        entityId: data.user.id,
        entityType: 'user-profile',
        userId: data.user.id,
        userEmail: data.user.email,
        payload: data.user as unknown as Record<string, unknown>,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      clearAuthSession();
      window.location.href = '/';
    },
  });

  return {
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    signupError: signupMutation.error,
  };
}
