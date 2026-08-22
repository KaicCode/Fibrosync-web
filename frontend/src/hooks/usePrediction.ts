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

  return {
    latestPrediction: latestQuery.data,
    latestRulePrediction: latestQuery.data,
    latestAiPrediction: latestAiQuery.data,
    isLoadingLatest: latestQuery.isLoading,
    isLoadingLatestAi: latestAiQuery.isLoading,
    refetchLatestPrediction: latestQuery.refetch,
  };
}
