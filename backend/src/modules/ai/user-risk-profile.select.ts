import type { Prisma } from '@prisma/client';

export const userRiskProfileSelect = {
  id: true,
  analysisWindowDays: true,
  currentPersonalizedScore: true,
  baselineScore: true,
  lastCrisisSignalCount: true,
  summary: true,
  triggerPatterns: true,
  personalizedWeights: true,
  sourceWindowStart: true,
  sourceWindowEnd: true,
  lastAnalyzedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserRiskProfileSelect;

export type UserRiskProfileDetails = Prisma.UserRiskProfileGetPayload<{
  select: typeof userRiskProfileSelect;
}>;
