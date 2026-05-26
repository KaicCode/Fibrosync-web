import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/app-store';
import { userService } from '../services/user.service';
import type { UserProfile } from '../services/user.service';

export function useUser() {
  const queryClient = useQueryClient();
  const authSession = useAppStore((state) => state.authSession);
  const setAuthSession = useAppStore((state) => state.setAuthSession);

  const userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: userService.getCurrentUser,
    retry: false, // Don't retry if it fails (e.g., 401)
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) => userService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
    },
  });

  useEffect(() => {
    if (!userQuery.data || !authSession) {
      return;
    }

    if (
      authSession.user.id === userQuery.data.id &&
      authSession.user.fullName === userQuery.data.fullName &&
      authSession.user.updatedAt === userQuery.data.updatedAt
    ) {
      return;
    }

    setAuthSession({
      token: authSession.token,
      user: {
        ...authSession.user,
        id: userQuery.data.id,
        email: userQuery.data.email,
        name: userQuery.data.fullName,
        fullName: userQuery.data.fullName,
        birthDate: userQuery.data.birthDate ?? null,
        gender: userQuery.data.gender ?? null,
        heightCm: userQuery.data.heightCm ?? null,
        weightKg: userQuery.data.weightKg ?? null,
        countryCode: userQuery.data.countryCode ?? null,
        timezone: userQuery.data.timezone,
        role: userQuery.data.role as 'USER' | 'ADMIN',
        onboardingCompleted: userQuery.data.onboardingCompleted,
        lastLoginAt: userQuery.data.lastLoginAt ?? null,
        createdAt: userQuery.data.createdAt,
        updatedAt: userQuery.data.updatedAt,
      },
    });
  }, [authSession, setAuthSession, userQuery.data]);

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  };
}
