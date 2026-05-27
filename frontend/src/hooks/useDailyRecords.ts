import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailyRecordService } from "../services/daily-record.service";
import type {
  CreateDailyRecordDto,
  DailyRecordFilters,
} from "../services/daily-record.service";

export function useDailyRecords(filters?: DailyRecordFilters) {
  const queryClient = useQueryClient();

  const recordsQuery = useQuery({
    queryKey: [
      "dailyRecords",
      filters?.dateFrom ?? null,
      filters?.dateTo ?? null,
      filters?.page ?? 1,
      filters?.limit ?? null,
    ],
    queryFn: () => dailyRecordService.getDailyRecords(filters),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDailyRecordDto) =>
      dailyRecordService.createDailyRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyRecords"] });
      queryClient.invalidateQueries({ queryKey: ["latestPrediction"] });
      queryClient.invalidateQueries({ queryKey: ["predictionHistory"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateDailyRecordDto>;
    }) => dailyRecordService.updateDailyRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyRecords"] });
      queryClient.invalidateQueries({ queryKey: ["latestPrediction"] });
      queryClient.invalidateQueries({ queryKey: ["predictionHistory"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dailyRecordService.deleteDailyRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyRecords"] });
    },
  });

  return {
    records: recordsQuery.data || [],
    isLoading: recordsQuery.isLoading,
    error: recordsQuery.error,
    createRecord: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateRecord: updateMutation.mutateAsync,
    deleteRecord: deleteMutation.mutateAsync,
  };
}
