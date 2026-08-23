export const SYSTEM_SETTINGS_ID = 'global';

export const DEFAULT_SYSTEM_SETTINGS = {
  aiEnabled: true,
  inAppNotificationsEnabled: true,
  symptomNotificationsEnabled: true,
  attentionModerateThreshold: 40,
  attentionHighThreshold: 65,
  attentionCriticalThreshold: 85,
} as const;

export type EditableSystemSettings = {
  aiEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  symptomNotificationsEnabled: boolean;
  attentionModerateThreshold: number;
  attentionHighThreshold: number;
  attentionCriticalThreshold: number;
};

export const SYSTEM_SETTINGS_LABELS: Record<
  keyof EditableSystemSettings,
  string
> = {
  aiEnabled: 'Análises com inteligência artificial',
  inAppNotificationsEnabled: 'Avisos no FibroSync',
  symptomNotificationsEnabled: 'Informações sobre sintomas',
  attentionModerateThreshold: 'Atenção moderada',
  attentionHighThreshold: 'Atenção elevada',
  attentionCriticalThreshold: 'Atenção crítica',
};

export const SYSTEM_SETTINGS_KEYS = Object.keys(
  DEFAULT_SYSTEM_SETTINGS,
) as Array<keyof EditableSystemSettings>;
