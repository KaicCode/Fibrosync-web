import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  buildAuthSession,
  hasStoredAuthTokens,
} from '@/lib/auth-session';
import { useAppStore } from '@/store/app-store';
import { supabaseSyncService } from '@/services/supabase-sync.service';
import { userService } from '../services/user.service';
import type { UserProfile } from '../services/user.service';

export function useUser() {
  const queryClient = useQueryClient();
  const authSession = useAppStore((state) => state.authSession);
  const setAuthSession = useAppStore((state) => state.setAuthSession);

  const userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: userService.getCurrentUser,
    enabled: Boolean(authSession) || hasStoredAuthTokens(),
    retry: false, // Don't retry if it fails (e.g., 401)
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) => userService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      void supabaseSyncService.upsertRecord({
        entityId: updatedUser.id,
        entityType: 'user-profile',
        userId: updatedUser.id,
        userEmail: updatedUser.email,
        payload: updatedUser as unknown as Record<string, unknown>,
      });
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

    const nextSession = buildAuthSession(authSession.token, userQuery.data);
    setAuthSession({
      ...nextSession,
      user: {
        ...authSession.user,
        ...nextSession.user,
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
