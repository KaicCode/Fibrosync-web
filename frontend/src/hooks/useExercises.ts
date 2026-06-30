import { useQuery } from '@tanstack/react-query';
import { exerciseService } from '@/services/exercise.service';
import type { ExerciseCategory, ExerciseDifficulty } from '@/services/exercise.service';

// Hook para listar exercícios com filtros opcionais de categoria e dificuldade
export function useExercises(filters?: {
  category?: ExerciseCategory;
  difficulty?: ExerciseDifficulty;
}) {
  const exercisesQuery = useQuery({
    queryKey: ['exercises', filters?.category ?? null, filters?.difficulty ?? null],
    queryFn: () => exerciseService.listExercises(filters),
    // Cache de 5 minutos — o catálogo raramente muda
    staleTime: 1000 * 60 * 5,
  });

  return {
    exercises: exercisesQuery.data ?? [],
    isLoading: exercisesQuery.isLoading,
    error: exercisesQuery.error,
  };
}

// Hook para buscar um exercício completo (com passo a passo) pelo id
export function useExerciseDetail(id: string | null) {
  const detailQuery = useQuery({
    queryKey: ['exercise', id],
    queryFn: () => exerciseService.getExerciseById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  return {
    exercise: detailQuery.data ?? null,
    isLoading: detailQuery.isLoading,
    error: detailQuery.error,
  };
}

// Hook para as estatísticas de progresso do usuário
export function useExerciseStats() {
  const statsQuery = useQuery({
    queryKey: ['exerciseStats'],
    queryFn: () => exerciseService.getStats(),
  });

  return {
    stats: statsQuery.data ?? null,
    isLoading: statsQuery.isLoading,
    error: statsQuery.error,
  };
}
