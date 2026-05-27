import { useQuery } from "@tanstack/react-query";
import { predictionService } from "../services/prediction.service";

export function usePrediction() {
  const latestQuery = useQuery({
    queryKey: ["latestPrediction"],
    queryFn: predictionService.getLatestPrediction,
  });

  const historyQuery = useQuery({
    queryKey: ["predictionHistory"],
    queryFn: predictionService.getPredictionHistory,
  });

  return {
    latestPrediction: latestQuery.data,
    isLoadingLatest: latestQuery.isLoading,
    predictionHistory: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
    refetchLatestPrediction: latestQuery.refetch,
  };
}
