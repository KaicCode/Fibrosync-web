import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exerciseService } from '@/services/exercise.service';
import type { CreateExerciseHistoryDto } from '@/services/exercise.service';

// Hook para gerenciar histórico de exercícios: leitura + registro de conclusão
export function useExerciseHistory() {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ['exerciseHistory'],
    queryFn: () => exerciseService.listHistory(),
  });

  // Mutation para registrar um exercício concluído
  const completeMutation = useMutation({
    mutationFn: (dto: CreateExerciseHistoryDto) =>
      exerciseService.completeExercise(dto),
    onSuccess: () => {
      // Invalida as queries que dependem do histórico para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['exerciseHistory'] });
      queryClient.invalidateQueries({ queryKey: ['exerciseStats'] });
    },
  });

  // Identifica quais exercícios já foram concluídos HOJE
  const today = new Date().toISOString().split('T')[0];
  const completedTodayIds = new Set(
    (historyQuery.data ?? [])
      .filter((h) => h.completedAt.startsWith(today))
      .map((h) => h.exercise.id),
  );

  return {
    history: historyQuery.data ?? [],
    isLoading: historyQuery.isLoading,
    error: historyQuery.error,
    completeExercise: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
    completedTodayIds,
  };
}
