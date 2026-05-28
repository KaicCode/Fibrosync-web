import { useQuery } from "@tanstack/react-query";
import { predictionService } from "../services/prediction.service";

export function usePrediction() {
  const latestQuery = useQuery({
    queryKey: ["latestPrediction"],
    queryFn: predictionService.getLatestPrediction,
  });

  const latestAiQuery = useQuery({
    queryKey: ["latestAiPrediction"],
    queryFn: predictionService.getLatestAiPrediction,
  });

  const historyQuery = useQuery({
    queryKey: ["predictionHistory"],
    queryFn: predictionService.getPredictionHistory,
  });

  return {
    latestPrediction: latestQuery.data,
    latestRulePrediction: latestQuery.data,
    latestAiPrediction: latestAiQuery.data,
    isLoadingLatest: latestQuery.isLoading,
    isLoadingLatestAi: latestAiQuery.isLoading,
    predictionHistory: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
    refetchLatestPrediction: latestQuery.refetch,
  };
}
