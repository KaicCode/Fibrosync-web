import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import type { UserProfile } from '../services/user.service';

export function useUser() {
  const queryClient = useQueryClient();

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

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  };
}
