import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import type { AppSettings } from '@/types'

const API_BASE = '/api/v1'
const SETTINGS_KEY = ['settings']

/**
 * Fetches current application settings from the backend.
 */
async function fetchSettings(): Promise<AppSettings> {
  const { data } = await axios.get<AppSettings>(`${API_BASE}/settings/`)
  return data
}

/**
 * Updates application settings on the backend.
 */
async function updateSettingsApi(settings: AppSettings): Promise<AppSettings> {
  const { data } = await axios.put<AppSettings>(`${API_BASE}/settings/`, settings)
  return data
}

/**
 * Hook for fetching and managing application settings.
 *
 * @returns Query result with settings data, loading state, and refetch function
 *
 * @example
 * const { data: settings, isLoading } = useSettings()
 */
export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

/**
 * Hook for updating application settings with optimistic updates.
 *
 * @returns Mutation object with mutate and mutateAsync methods
 *
 * @example
 * const mutation = useUpdateSettings()
 * await mutation.mutateAsync({ ...settings, topK: 7 })
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSettingsApi,
    onSuccess: (data) => {
      // Update the cache with the new settings
      queryClient.setQueryData(SETTINGS_KEY, data)
    },
  })
}
