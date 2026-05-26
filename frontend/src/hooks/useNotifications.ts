import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';

export function useNotifications(
  params?: {
    limit?: number;
    page?: number;
    unreadOnly?: boolean;
  },
) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications', params?.page ?? 1, params?.limit ?? null, params?.unreadOnly ?? false],
    queryFn: () => notificationService.getNotifications(params),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notificationsQuery.data?.filter((n) => !n.read).length || 0;

  return {
    notifications: notificationsQuery.data || [],
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    unreadCount,
    markAsRead: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
}
