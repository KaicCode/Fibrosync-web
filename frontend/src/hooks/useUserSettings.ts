import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userSettingsService } from '@/services/user-settings.service'
import type { UpdateUserSettingsDto } from '@/services/user-settings.service'

export function useUserSettings() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: ['userSettings'],
    queryFn: userSettingsService.getSettings,
    retry: false,
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (data: UpdateUserSettingsDto) => userSettingsService.updateSettings(data),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(['userSettings'], updatedSettings)
    },
  })

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,
  }
}
