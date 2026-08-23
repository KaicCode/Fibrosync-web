export type AdminDashboardIssueSection =
  | 'overview'
  | 'growth'
  | 'activity'
  | 'professionals'
  | 'recentActivity'
  | 'pending'
  | 'platformStatus';

export interface AdminDashboardIssue {
  section: AdminDashboardIssueSection;
  message: string;
}

export interface AdminDashboardOverview {
  totalUsers: number;
  patients: number;
  professionals: number;
  admins: number;
  activeUsers: number;
  activeUsersDefinition: string;
  newUsersInPeriod: number;
  newUsersPreviousPeriod: number;
  newUsersChangePercent: number | null;
}

export interface AdminDashboardDistribution {
  patients: number;
  professionals: number;
  admins: number;
}

export interface AdminDashboardGrowthPoint {
  date: string;
  total: number;
  patients: number;
  professionals: number;
}

export interface AdminDashboardGrowth {
  series: AdminDashboardGrowthPoint[];
}

export interface AdminDashboardActivityPoint {
  date: string;
  total: number;
}

export interface AdminDashboardActivity {
  totalRecords: number;
  recordsInPeriod: number;
  patientsWithRecordsInPeriod: number;
  series: AdminDashboardActivityPoint[];
}

export interface AdminDashboardPendingProfessional {
  id: string;
  fullName: string;
  specialty: string | null;
  createdAt: string;
  accountStatus: 'PENDING_PROFILE';
}

export interface AdminDashboardProfessionals {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  pendingItems: AdminDashboardPendingProfessional[];
}

export interface AdminDashboardRecentActivityItem {
  id: string;
  type: 'USER_CREATED' | 'PROFESSIONAL_COMPLETED_PROFILE';
  title: string;
  description: string;
  occurredAt: string;
}

export interface AdminDashboardRecentActivity {
  items: AdminDashboardRecentActivityItem[];
}

export interface AdminDashboardPendingItem {
  id: string;
  title: string;
  description: string;
  status: string;
}

export interface AdminDashboardPending {
  items: AdminDashboardPendingItem[];
}

export interface AdminDashboardPlatformStatus {
  api: 'operational';
  database: 'operational';
  checkedAt: string;
}

export interface AdminDashboardResponse {
  generatedAt: string;
  periodDays: 7 | 30 | 90;
  activeUsersWindowDays: number;
  overview: AdminDashboardOverview | null;
  distribution: AdminDashboardDistribution | null;
  growth: AdminDashboardGrowth | null;
  activity: AdminDashboardActivity | null;
  professionals: AdminDashboardProfessionals | null;
  recentActivity: AdminDashboardRecentActivity | null;
  pending: AdminDashboardPending | null;
  platformStatus: AdminDashboardPlatformStatus | null;
  issues: AdminDashboardIssue[];
}
