import type { Prisma } from '@prisma/client';

export const communityPostResponseSelect = {
  id: true,
  type: true,
  content: true,
  tags: true,
  likesCount: true,
  commentsCount: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      role: true,
    },
  },
} satisfies Prisma.CommunityPostSelect;

export type CommunityPostDetails = Prisma.CommunityPostGetPayload<{
  select: typeof communityPostResponseSelect;
}>;
