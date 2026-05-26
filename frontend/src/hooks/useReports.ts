import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/report.service';

export function useReports(period: 'weekly' | 'monthly' | 'quarterly' = 'weekly') {
  const summaryQuery = useQuery({
    queryKey: ['reportSummary'],
    queryFn: reportService.getSummary,
  });

  const reportQuery = useQuery({
    queryKey: ['report', period],
    queryFn: () => reportService.generateReport(period),
  });

  return {
    summary: summaryQuery.data,
    isLoadingSummary: summaryQuery.isLoading,
    report: reportQuery.data,
    isLoadingReport: reportQuery.isLoading,
  };
}
