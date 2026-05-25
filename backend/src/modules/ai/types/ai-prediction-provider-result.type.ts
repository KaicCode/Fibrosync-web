import type { AiPredictionRiskLevel } from '@prisma/client';

export interface AiPredictionProviderResult {
  provider: string;
  model: string;
  probabilityScore: number;
  riskLevel: AiPredictionRiskLevel;
  explanation: string;
  suggestedAction: string;
  providerResponse?: Record<string, unknown>;
}
