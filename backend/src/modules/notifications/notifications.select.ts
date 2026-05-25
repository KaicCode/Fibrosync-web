import type { Prisma } from '@prisma/client';

export const notificationResponseSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  status: true,
  channel: true,
  payload: true,
  sentAt: true,
  readAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationSelect;

export type NotificationDetails = Prisma.NotificationGetPayload<{
  select: typeof notificationResponseSelect;
}>;
