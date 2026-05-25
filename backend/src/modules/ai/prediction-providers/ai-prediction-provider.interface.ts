import type { AiPredictionContext } from '../types/ai-prediction-context.type';
import type { AiPredictionProviderResult } from '../types/ai-prediction-provider-result.type';

export interface AiPredictionProvider {
  predict(context: AiPredictionContext): Promise<AiPredictionProviderResult>;
}
