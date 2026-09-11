import { useQuery } from '@tanstack/react-query'
import {
  DASHBOARD_STATS_PERIOD_DAYS,
  DASHBOARD_STATS_QUERY_KEY,
  getDashboardStats,
} from '@/services/adminService'

export function useDashboardStats() {
  return useQuery({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: () => getDashboardStats(DASHBOARD_STATS_PERIOD_DAYS),
    // Dashboard and statistics must always reflect the latest backend response.
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })
}