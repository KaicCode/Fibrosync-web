import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { AiPredictionRiskLevel } from '@prisma/client';
import type { AiPredictionProvider } from './ai-prediction-provider.interface';
import type { AiPredictionContext } from '../types/ai-prediction-context.type';
import type { AiPredictionProviderResult } from '../types/ai-prediction-provider-result.type';

interface GeminiPredictionPayload {
  probabilityScore: number;
  riskLevel: string;
  explanation: string;
  suggestedAction: string;
}

const predictionResponseJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    probabilityScore: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description:
        'Estimated probability, from 0 to 100, of a fibromyalgia crisis in the next 24 to 72 hours.',
    },
    riskLevel: {
      type: 'string',
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      description: 'Risk band derived from the behavioral context.',
    },
    explanation: {
      type: 'string',
      description:
        'A concise clinical-style explanation grounded only in the provided user context and indirect signals.',
    },
    suggestedAction: {
      type: 'string',
      description:
        'A concise supportive action plan focused on pacing, recovery, hydration, routine, and care escalation when appropriate.',
    },
  },
  required: ['probabilityScore', 'riskLevel', 'explanation', 'suggestedAction'],
} as const;

@Injectable()
export class GeminiAiPredictionProvider implements AiPredictionProvider {
  private readonly apiKey: string;
  private readonly configuredModel: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ai.geminiApiKey') ?? '';
    this.configuredModel =
      this.configService.get<string>('ai.geminiModel') ?? 'gemini-2.5-flash';
  }

  async predict(
    context: AiPredictionContext,
  ): Promise<AiPredictionProviderResult> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'Gemini integration is not configured. Set GEMINI_API_KEY to enable AI predictions.',
      );
    }

    const client = new GoogleGenAI({
      apiKey: this.apiKey,
    });

    try {
      const response = await client.models.generateContent({
        model: this.configuredModel,
        contents: this.buildPrompt(context),
        config: {
          systemInstruction: this.buildSystemInstruction(),
          temperature: 0.2,
          maxOutputTokens: 700,
          responseMimeType: 'application/json',
          responseJsonSchema: predictionResponseJsonSchema,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const parsed = this.parseResponse(response.text);

      return {
        provider: 'gemini',
        model: response.modelVersion ?? this.configuredModel,
        probabilityScore: this.normalizeProbabilityScore(
          parsed.probabilityScore,
        ),
        riskLevel: this.normalizeRiskLevel(
          parsed.riskLevel,
          parsed.probabilityScore,
        ),
        explanation: parsed.explanation.trim(),
        suggestedAction: parsed.suggestedAction.trim(),
        providerResponse: {
          rawText: response.text ?? null,
          responseId: response.responseId ?? null,
          modelVersion: response.modelVersion ?? null,
          usageMetadata: response.usageMetadata ?? null,
          promptFeedback: response.promptFeedback ?? null,
        },
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'Gemini prediction request failed. Verify the API key, model configuration, and provider availability.',
      );
    }
  }

  private buildSystemInstruction(): string {
    return [
      'You are FibroSync AI Prediction, a clinical decision-support assistant for fibromyalgia flare prevention.',
      'Analyze only the provided tracking context. Do not claim you trained on user history or learned a custom model.',
      'A pseudo-learning risk profile may be included in the context; treat it as a summary of repeated individual patterns, not as a trained model.',
      'Do not rely on explicit self-reported pain to make the prediction.',
      'Use indirect signals such as sleep disruption, fatigue, mood changes, stress, physical activity, hydration, medication adherence, weather perception, actual weather metrics like temperature, humidity, apparent temperature, precipitation and atmospheric pressure, body-temperature perception, cognitive fog, sensory sensitivity, digestive issues, headache, anxiety, depression, and repeating cycles.',
      'Estimate the risk of a flare in the next 24 to 72 hours.',
      'Keep explanation and suggested action concise, specific, and grounded in the supplied data.',
      'Do not return markdown.',
    ].join(' ');
  }

  private buildPrompt(context: AiPredictionContext): string {
    return [
      'Analyze this FibroSync context and estimate the likelihood of a fibromyalgia crisis before the user explicitly reports pain.',
      'Base your reasoning only on the JSON data below. If the evidence is limited or mixed, reflect that uncertainty in the explanation while still returning a probability score and risk level.',
      'Focus on the most relevant patterns, including repeated cycles across recent days.',
      'Context JSON:',
      JSON.stringify(context, null, 2),
    ].join('\n\n');
  }

  private parseResponse(rawText: string | undefined): GeminiPredictionPayload {
    if (!rawText) {
      throw new ServiceUnavailableException(
        'Gemini returned an empty prediction payload.',
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(rawText) as unknown;
    } catch {
      throw new ServiceUnavailableException(
        'Gemini returned a non-JSON prediction payload.',
      );
    }

    if (!this.isValidPredictionPayload(parsed)) {
      throw new ServiceUnavailableException(
        'Gemini returned an invalid prediction structure.',
      );
    }

    return parsed;
  }

  private isValidPredictionPayload(
    value: unknown,
  ): value is GeminiPredictionPayload {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as Record<string, unknown>;

    return (
      typeof candidate.probabilityScore === 'number' &&
      typeof candidate.riskLevel === 'string' &&
      typeof candidate.explanation === 'string' &&
      candidate.explanation.trim().length > 0 &&
      typeof candidate.suggestedAction === 'string' &&
      candidate.suggestedAction.trim().length > 0
    );
  }

  private normalizeProbabilityScore(score: number): number {
    if (!Number.isFinite(score)) {
      return 0;
    }

    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  private normalizeRiskLevel(
    rawRiskLevel: string,
    probabilityScore: number,
  ): AiPredictionRiskLevel {
    const normalized = rawRiskLevel.trim().toUpperCase();

    if (normalized === AiPredictionRiskLevel.LOW) {
      return AiPredictionRiskLevel.LOW;
    }

    if (normalized === AiPredictionRiskLevel.MEDIUM) {
      return AiPredictionRiskLevel.MEDIUM;
    }

    if (normalized === AiPredictionRiskLevel.HIGH) {
      return AiPredictionRiskLevel.HIGH;
    }

    const score = this.normalizeProbabilityScore(probabilityScore);

    if (score >= 70) {
      return AiPredictionRiskLevel.HIGH;
    }

    if (score >= 40) {
      return AiPredictionRiskLevel.MEDIUM;
    }

    return AiPredictionRiskLevel.LOW;
  }
}
