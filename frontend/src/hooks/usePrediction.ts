import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { predictionService } from '../services/prediction.service';

export function usePrediction() {
  const queryClient = useQueryClient();

  const latestQuery = useQuery({
    queryKey: ['latestPrediction'],
    queryFn: predictionService.getLatestPrediction,
  });

  const historyQuery = useQuery({
    queryKey: ['predictionHistory'],
    queryFn: predictionService.getPredictionHistory,
  });

  const predictMutation = useMutation({
    mutationFn: () => predictionService.requestNewPrediction(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latestPrediction'] });
      queryClient.invalidateQueries({ queryKey: ['predictionHistory'] });
    },
  });

  return {
    latestPrediction: latestQuery.data,
    isLoadingLatest: latestQuery.isLoading,
    predictionHistory: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
    requestPrediction: predictMutation.mutateAsync,
    isPredicting: predictMutation.isPending,
  };
}
