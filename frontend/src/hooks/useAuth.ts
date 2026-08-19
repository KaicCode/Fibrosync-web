import { useMutation } from '@tanstack/react-query';
import {
  buildAuthSession,
  clearStoredAuthTokens,
  storeAuthTokens,
} from '@/lib/auth-session';
import { useAppStore } from '@/store/app-store';
import { supabaseSyncService } from '@/services/supabase-sync.service';
import { authService } from '../services/auth.service';
import type { LoginDto, SignupDto } from '../services/auth.service';

export function useAuth() {
  const setAuthSession = useAppStore((state) => state.setAuthSession);
  const clearAuthSession = useAppStore((state) => state.clearAuthSession);

  const loginMutation = useMutation({
    mutationFn: (data: LoginDto) => authService.login(data),
    onSuccess: (data) => {
      storeAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      setAuthSession(buildAuthSession(data.accessToken, data.user));
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
      storeAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      setAuthSession(buildAuthSession(data.accessToken, data.user));
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
    onSettled: () => {
      clearStoredAuthTokens();
      clearAuthSession();
      window.location.href = '/login';
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
