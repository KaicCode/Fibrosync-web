import { useQuery } from '@tanstack/react-query'
import { reportService, type ReportPeriod } from '../services/report.service'

export function useReports(period: ReportPeriod = 'weekly') {
  const reportQuery = useQuery({
    queryKey: ['report', period],
    queryFn: () => reportService.generateReport(period),
  })

  return {
    report: reportQuery.data,
    error: reportQuery.error,
    isLoading: reportQuery.isLoading,
    isFetching: reportQuery.isFetching,
    refetch: reportQuery.refetch,
  }
}
