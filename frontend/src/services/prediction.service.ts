import { apiCall } from "@/lib/api-client";

export interface PredictionRiskFactor {
  key: string;
  label: string;
  value: number;
  contribution: number;
}

interface PredictionApiResponse {
  id: string;
  userId: string;
  dailyRecordId: string;
  predictedFor: string;
  probability: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  confidenceScore: number | null;
  riskFactors: PredictionRiskFactor[];
  recommendationSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PredictionHistoryResponse {
  items: PredictionApiResponse[];
}

interface AiPredictionApiResponse {
  id: string;
  dailyRecordId?: string | null;
  provider: string;
  model: string;
  promptVersion: string;
  probabilityScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  explanation: string;
  suggestedAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prediction {
  id: string;
  userId: string;
  dailyRecordId: string;
  predictedFor: string;
  probability: number;
  probabilityScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  confidenceScore: number | null;
  riskFactors: PredictionRiskFactor[];
  recommendationSummary: string | null;
  explanation: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiPrediction {
  id: string;
  dailyRecordId?: string | null;
  provider: string;
  model: string;
  promptVersion: string;
  probabilityScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  explanation: string;
  suggestedAction: string;
  createdAt: string;
  updatedAt: string;
}

function mapPrediction(response: PredictionApiResponse): Prediction {
  return {
    ...response,
    probabilityScore: Math.round(response.probability * 100),
    explanation:
      response.recommendationSummary ??
      "Sem explicação complementar disponível para esta predição.",
  };
}

export const predictionService = {
  getLatestPrediction: async (): Promise<Prediction | null> => {
    try {
      const response = await apiCall<PredictionApiResponse>(
        "get",
        "/crisis-predictions/latest",
      );
      return mapPrediction(response);
    } catch {
      return null;
    }
  },

  getLatestAiPrediction: async (): Promise<AiPrediction | null> => {
    try {
      return await apiCall<AiPredictionApiResponse>(
        "get",
        "/ai/predictions/latest",
      );
    } catch {
      return null;
    }
  },

  getPredictionHistory: async (): Promise<Prediction[]> => {
    const response = await apiCall<PredictionHistoryResponse>(
      "get",
      "/crisis-predictions",
    );
    return response.items.map(mapPrediction);
  },
};
