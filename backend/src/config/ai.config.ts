import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  predictionLookbackDays: Number(process.env.AI_PREDICTION_LOOKBACK_DAYS ?? 21),
  patternAnalysisLookbackDays: Number(
    process.env.AI_PATTERN_ANALYSIS_LOOKBACK_DAYS ?? 30,
  ),
  promptVersion: process.env.AI_PREDICTION_PROMPT_VERSION ?? 'v1',
}));
