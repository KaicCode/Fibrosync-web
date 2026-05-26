import { api } from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  status: string;
  channel: string;
  sentAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationListResponse {
  items: Notification[];
}

export const notificationService = {
  getNotifications: async (
    params?: {
      limit?: number;
      page?: number;
      unreadOnly?: boolean;
    },
  ): Promise<Notification[]> => {
    const response = await api.get<NotificationListResponse>('/notifications', {
      params,
    });
    return response.data.items;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },
};
