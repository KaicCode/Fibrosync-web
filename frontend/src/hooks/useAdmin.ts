import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

export function useAdmin() {
  const dashboardQuery = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: adminService.getDashboardAnalytics,
  });

  const usersQuery = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminService.getUsers(),
  });

  return {
    dashboardAnalytics: dashboardQuery.data,
    isLoadingDashboard: dashboardQuery.isLoading,
    users: usersQuery.data?.items || [],
    isLoadingUsers: usersQuery.isLoading,
  };
}
