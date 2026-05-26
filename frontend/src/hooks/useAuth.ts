import { useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/store/app-store';
import { authService } from '../services/auth.service';
import type { LoginDto, SignupDto } from '../services/auth.service';

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
        user: {
          id: Number(data.user.id) || 0,
          email: data.user.email,
          name: data.user.fullName,
          country: '',
          role: data.user.role as 'USER' | 'ADMIN',
        },
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
        user: {
          id: Number(data.user.id) || 0,
          email: data.user.email,
          name: data.user.fullName,
          country: '',
          role: data.user.role as 'USER' | 'ADMIN',
        },
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
