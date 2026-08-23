import type { EditableSystemSettings } from './system-settings.constants';

export interface SystemSettingsSummary {
  settings: EditableSystemSettings & {
    updatedAt: string;
    updatedBy: {
      id: string;
      fullName: string;
    } | null;
  };
  defaults: EditableSystemSettings;
  capabilities: {
    aiProviderConfigured: boolean;
    inAppNotificationsAvailable: boolean;
    emailNotificationsAvailable: boolean;
    smsNotificationsAvailable: boolean;
    schedulerAvailable: boolean;
    ruleEngineExecutionMode: 'after_daily_record';
    aiExecutionMode: 'on_demand';
  };
  recentChanges: Array<{
    id: string;
    key: keyof EditableSystemSettings;
    label: string;
    oldValue: string | null;
    newValue: string | null;
    changedAt: string;
    changedBy: {
      id: string | null;
      fullName: string;
    } | null;
  }>;
}
