import assert from 'node:assert/strict';
import test from 'node:test';
import { ConfigService } from '@nestjs/config';
import { RiskLevel, Role } from '@prisma/client';
import { AiService } from '../src/modules/ai/ai.service';
import type { PatternAnalysisService } from '../src/modules/ai/pattern-analysis.service';
import type { AiPredictionProvider } from '../src/modules/ai/prediction-providers/ai-prediction-provider.interface';
import { ROLES_KEY } from '../src/common/decorators/roles.decorator';
import type { PrismaService } from '../src/database/prisma.service';
import type { NotificationsService } from '../src/modules/notifications/notifications.service';
import { SystemSettingsController } from '../src/modules/system-settings/system-settings.controller';
import {
  DEFAULT_SYSTEM_SETTINGS,
  type EditableSystemSettings,
} from '../src/modules/system-settings/system-settings.constants';
import {
  resolveRuleRiskLevelFromProbability,
  shouldExposeInAppNotifications,
  shouldGenerateSymptomNotification,
  validateEditableSystemSettings,
} from '../src/modules/system-settings/system-settings.helpers';
import type { SystemSettingsService } from '../src/modules/system-settings/system-settings.service';

function buildSettings(
  overrides: Partial<EditableSystemSettings> = {},
): EditableSystemSettings {
  return {
    ...DEFAULT_SYSTEM_SETTINGS,
    ...overrides,
  };
}

test('validateEditableSystemSettings rejects inconsistent thresholds', () => {
  const validationMessage = validateEditableSystemSettings(
    buildSettings({
      attentionModerateThreshold: 80,
      attentionHighThreshold: 70,
      attentionCriticalThreshold: 90,
    }),
  );

  assert.equal(
    validationMessage,
    'O nível moderado deve ser menor que o elevado, e o elevado deve ser menor que o crítico.',
  );
});

test('rule engine classification changes when thresholds change', () => {
  const score75WithCurrentThresholds = resolveRuleRiskLevelFromProbability(
    0.75,
    buildSettings({
      attentionModerateThreshold: 40,
      attentionHighThreshold: 65,
      attentionCriticalThreshold: 85,
    }),
  );

  const score75WithRaisedHighThreshold = resolveRuleRiskLevelFromProbability(
    0.75,
    buildSettings({
      attentionModerateThreshold: 40,
      attentionHighThreshold: 80,
      attentionCriticalThreshold: 90,
    }),
  );

  assert.equal(score75WithCurrentThresholds, RiskLevel.HIGH);
  assert.equal(score75WithRaisedHighThreshold, RiskLevel.MODERATE);
});

test('notification hierarchy respects global and individual permissions', () => {
  const settings = buildSettings({
    inAppNotificationsEnabled: true,
    symptomNotificationsEnabled: true,
    attentionHighThreshold: 65,
  });

  assert.equal(shouldGenerateSymptomNotification(75, settings), true);
  assert.equal(shouldExposeInAppNotifications(true, true), true);
  assert.equal(shouldExposeInAppNotifications(false, true), false);
  assert.equal(shouldExposeInAppNotifications(true, false), false);
});

test('ai service blocks new predictions when AI is disabled', async () => {
  const aiService = new AiService(
    {} as PrismaService,
    {
      get: () => undefined,
    } as ConfigService,
    {} as NotificationsService,
    {
      getRuntimeSettings: async () =>
        buildSettings({
          aiEnabled: false,
        }),
    } as SystemSettingsService,
    {} as PatternAnalysisService,
    {} as AiPredictionProvider,
  );

  await assert.rejects(
    () => aiService.predict('user-id', {}),
    /inteligência artificial estão desativadas/i,
  );
});

test('system settings controller stays protected for admins only', () => {
  const roles = Reflect.getMetadata(ROLES_KEY, SystemSettingsController) as
    | Role[]
    | undefined;

  assert.deepEqual(roles, [Role.ADMIN]);
});
