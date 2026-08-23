import { RiskLevel } from '@prisma/client';
import { NotificationType } from '@/modules/notifications/enums/notification-type.enum';
import type { EditableSystemSettings } from './system-settings.constants';

export function validateEditableSystemSettings(
  settings: EditableSystemSettings,
): string | null {
  const values = [
    settings.attentionModerateThreshold,
    settings.attentionHighThreshold,
    settings.attentionCriticalThreshold,
  ];

  const hasInvalidRange = values.some(
    (value) => !Number.isInteger(value) || value < 0 || value > 100,
  );

  if (hasInvalidRange) {
    return 'Os níveis de atenção devem ser números inteiros entre 0 e 100.';
  }

  if (
    settings.attentionModerateThreshold >= settings.attentionHighThreshold ||
    settings.attentionHighThreshold >= settings.attentionCriticalThreshold
  ) {
    return 'O nível moderado deve ser menor que o elevado, e o elevado deve ser menor que o crítico.';
  }

  return null;
}

export function probabilityToScore(probability: number): number {
  return Math.round(Math.max(0, Math.min(probability, 1)) * 100);
}

export function resolveRuleRiskLevelFromProbability(
  probability: number,
  settings: EditableSystemSettings,
): RiskLevel {
  const score = probabilityToScore(probability);

  if (score >= settings.attentionCriticalThreshold) {
    return RiskLevel.CRITICAL;
  }

  if (score >= settings.attentionHighThreshold) {
    return RiskLevel.HIGH;
  }

  if (score >= settings.attentionModerateThreshold) {
    return RiskLevel.MODERATE;
  }

  return RiskLevel.LOW;
}

export function resolveSymptomNotificationType(
  score: number,
  settings: EditableSystemSettings,
): NotificationType | null {
  if (score >= settings.attentionCriticalThreshold) {
    return NotificationType.URGENT;
  }

  if (score >= settings.attentionHighThreshold) {
    return NotificationType.WARNING;
  }

  if (score >= settings.attentionModerateThreshold) {
    return NotificationType.PREVENTIVE;
  }

  return null;
}

export function shouldGenerateSymptomNotification(
  score: number,
  settings: EditableSystemSettings,
): boolean {
  return (
    settings.inAppNotificationsEnabled &&
    settings.symptomNotificationsEnabled &&
    score >= settings.attentionHighThreshold
  );
}

export function shouldExposeInAppNotifications(
  globalEnabled: boolean,
  userEnabled: boolean,
): boolean {
  return globalEnabled && userEnabled;
}
