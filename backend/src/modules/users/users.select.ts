import type { Prisma } from '@prisma/client';

export const userPublicSelect = {
  id: true,
  email: true,
  fullName: true,
  birthDate: true,
  gender: true,
  heightCm: true,
  weightKg: true,
  countryCode: true,
  timezone: true,
  role: true,
  onboardingCompleted: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof userPublicSelect;
}>;
