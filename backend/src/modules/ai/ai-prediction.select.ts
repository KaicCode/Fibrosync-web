import type { Prisma } from '@prisma/client';

export const aiPredictionResponseSelect = {
  id: true,
  dailyRecordId: true,
  provider: true,
  model: true,
  promptVersion: true,
  probabilityScore: true,
  riskLevel: true,
  explanation: true,
  suggestedAction: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AiPredictionSelect;

export type AiPredictionDetails = Prisma.AiPredictionGetPayload<{
  select: typeof aiPredictionResponseSelect;
}>;
