import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { symptomsService } from '../services/symptoms.service';
import type { CreateSymptomDto } from '../services/symptoms.service';

export function useSymptoms() {
  const queryClient = useQueryClient();

  const symptomsQuery = useQuery({
    queryKey: ['symptoms'],
    queryFn: symptomsService.getSymptoms,
  });

  const addMutation = useMutation({
    mutationFn: (data: CreateSymptomDto) => symptomsService.addSymptom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSymptomDto> }) => 
      symptomsService.updateSymptom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => symptomsService.deleteSymptom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
    },
  });

  return {
    symptoms: symptomsQuery.data || [],
    isLoading: symptomsQuery.isLoading,
    error: symptomsQuery.error,
    addSymptom: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateSymptom: updateMutation.mutateAsync,
    deleteSymptom: deleteMutation.mutateAsync,
  };
}
