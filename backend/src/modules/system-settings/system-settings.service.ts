import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import {
  DEFAULT_SYSTEM_SETTINGS,
  SYSTEM_SETTINGS_ID,
  SYSTEM_SETTINGS_KEYS,
  SYSTEM_SETTINGS_LABELS,
  type EditableSystemSettings,
} from './system-settings.constants';
import { validateEditableSystemSettings } from './system-settings.helpers';
import type { ResetSystemSettingsDto } from './dto/reset-system-settings.dto';
import type { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import type { SystemSettingsSummary } from './system-settings.types';

const systemSettingsSelect = {
  id: true,
  aiEnabled: true,
  inAppNotificationsEnabled: true,
  symptomNotificationsEnabled: true,
  attentionModerateThreshold: true,
  attentionHighThreshold: true,
  attentionCriticalThreshold: true,
  updatedAt: true,
  updatedByUser: {
    select: {
      id: true,
      fullName: true,
    },
  },
} satisfies Prisma.SystemSettingsSelect;

const systemSettingsAuditSelect = {
  id: true,
  key: true,
  oldValue: true,
  newValue: true,
  createdAt: true,
  changedByUserId: true,
  changedByName: true,
  changedByUser: {
    select: {
      id: true,
      fullName: true,
    },
  },
} satisfies Prisma.SystemSettingsAuditLogSelect;

type SystemSettingsDetails = Prisma.SystemSettingsGetPayload<{
  select: typeof systemSettingsSelect;
}>;

type SystemSettingsAuditDetails = Prisma.SystemSettingsAuditLogGetPayload<{
  select: typeof systemSettingsAuditSelect;
}>;

type PrismaExecutor = PrismaService | Prisma.TransactionClient;

@Injectable()
export class SystemSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getSummary(): Promise<SystemSettingsSummary> {
    const [settings, recentChanges] = await Promise.all([
      this.getSettingsRecord(),
      this.prisma.systemSettingsAuditLog.findMany({
        where: {
          systemSettingsId: SYSTEM_SETTINGS_ID,
        },
        select: systemSettingsAuditSelect,
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      }),
    ]);

    return {
      settings: this.mapSettings(settings),
      defaults: { ...DEFAULT_SYSTEM_SETTINGS },
      capabilities: this.resolveCapabilities(),
      recentChanges: recentChanges.map((item) => this.mapAuditLog(item)),
    };
  }

  async updateSettings(
    adminUserId: string,
    dto: UpdateSystemSettingsDto,
  ): Promise<SystemSettingsSummary> {
    const current = await this.getSettingsRecord();
    this.assertExpectedUpdatedAt(current.updatedAt, dto.expectedUpdatedAt);

    const next: EditableSystemSettings = {
      aiEnabled: dto.aiEnabled ?? current.aiEnabled,
      inAppNotificationsEnabled:
        dto.inAppNotificationsEnabled ?? current.inAppNotificationsEnabled,
      symptomNotificationsEnabled:
        dto.symptomNotificationsEnabled ?? current.symptomNotificationsEnabled,
      attentionModerateThreshold:
        dto.attentionModerateThreshold ?? current.attentionModerateThreshold,
      attentionHighThreshold:
        dto.attentionHighThreshold ?? current.attentionHighThreshold,
      attentionCriticalThreshold:
        dto.attentionCriticalThreshold ?? current.attentionCriticalThreshold,
    };

    return this.persistSettings(adminUserId, current, next);
  }

  async resetSettings(
    adminUserId: string,
    dto: ResetSystemSettingsDto,
  ): Promise<SystemSettingsSummary> {
    const current = await this.getSettingsRecord();
    this.assertExpectedUpdatedAt(current.updatedAt, dto.expectedUpdatedAt);

    return this.persistSettings(adminUserId, current, {
      ...DEFAULT_SYSTEM_SETTINGS,
    });
  }

  async getRuntimeSettings(): Promise<EditableSystemSettings> {
    const settings = await this.getSettingsRecord();

    return {
      aiEnabled: settings.aiEnabled,
      inAppNotificationsEnabled: settings.inAppNotificationsEnabled,
      symptomNotificationsEnabled: settings.symptomNotificationsEnabled,
      attentionModerateThreshold: settings.attentionModerateThreshold,
      attentionHighThreshold: settings.attentionHighThreshold,
      attentionCriticalThreshold: settings.attentionCriticalThreshold,
    };
  }

  private async persistSettings(
    adminUserId: string,
    current: SystemSettingsDetails,
    next: EditableSystemSettings,
  ): Promise<SystemSettingsSummary> {
    const validationMessage = validateEditableSystemSettings(next);

    if (validationMessage) {
      throw new BadRequestException(validationMessage);
    }

    const changes = SYSTEM_SETTINGS_KEYS.filter(
      (key) => current[key] !== next[key],
    );

    if (changes.length === 0) {
      return this.getSummary();
    }

    const changedByUser = await this.prisma.user.findUnique({
      where: {
        id: adminUserId,
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.systemSettings.update({
        where: {
          id: SYSTEM_SETTINGS_ID,
        },
        data: {
          ...next,
          updatedByUserId: adminUserId,
        },
      });

      await tx.systemSettingsAuditLog.createMany({
        data: changes.map((key) => ({
          systemSettingsId: SYSTEM_SETTINGS_ID,
          key,
          oldValue: this.toAuditValue(key, current[key]),
          newValue: this.toAuditValue(key, next[key]),
          changedByUserId: adminUserId,
          changedByName: changedByUser?.fullName ?? 'Administrador',
        })),
      });
    });

    return this.getSummary();
  }

  private async getSettingsRecord(
    executor: PrismaExecutor = this.prisma,
  ): Promise<SystemSettingsDetails> {
    return executor.systemSettings.upsert({
      where: {
        id: SYSTEM_SETTINGS_ID,
      },
      update: {},
      create: {
        id: SYSTEM_SETTINGS_ID,
        ...DEFAULT_SYSTEM_SETTINGS,
      },
      select: systemSettingsSelect,
    });
  }

  private resolveCapabilities(): SystemSettingsSummary['capabilities'] {
    const aiProviderConfigured = Boolean(
      this.configService.get<string>('ai.geminiApiKey')?.trim(),
    );

    return {
      aiProviderConfigured,
      inAppNotificationsAvailable: true,
      emailNotificationsAvailable: false,
      smsNotificationsAvailable: false,
      schedulerAvailable: false,
      ruleEngineExecutionMode: 'after_daily_record',
      aiExecutionMode: 'on_demand',
    };
  }

  private mapSettings(
    settings: SystemSettingsDetails,
  ): SystemSettingsSummary['settings'] {
    return {
      aiEnabled: settings.aiEnabled,
      inAppNotificationsEnabled: settings.inAppNotificationsEnabled,
      symptomNotificationsEnabled: settings.symptomNotificationsEnabled,
      attentionModerateThreshold: settings.attentionModerateThreshold,
      attentionHighThreshold: settings.attentionHighThreshold,
      attentionCriticalThreshold: settings.attentionCriticalThreshold,
      updatedAt: settings.updatedAt.toISOString(),
      updatedBy: settings.updatedByUser
        ? {
            id: settings.updatedByUser.id,
            fullName: settings.updatedByUser.fullName,
          }
        : null,
    };
  }

  private mapAuditLog(
    item: SystemSettingsAuditDetails,
  ): SystemSettingsSummary['recentChanges'][number] {
    const fallbackName =
      item.changedByName?.trim() ||
      item.changedByUser?.fullName ||
      'Administrador';

    return {
      id: item.id,
      key: item.key as keyof EditableSystemSettings,
      label:
        SYSTEM_SETTINGS_LABELS[item.key as keyof EditableSystemSettings] ??
        item.key,
      oldValue: item.oldValue,
      newValue: item.newValue,
      changedAt: item.createdAt.toISOString(),
      changedBy: {
        id: item.changedByUserId,
        fullName: fallbackName,
      },
    };
  }

  private assertExpectedUpdatedAt(
    currentUpdatedAt: Date,
    expectedUpdatedAt: string,
  ): void {
    const parsedExpected = new Date(expectedUpdatedAt);

    if (Number.isNaN(parsedExpected.getTime())) {
      throw new BadRequestException('expectedUpdatedAt is invalid.');
    }

    if (currentUpdatedAt.getTime() !== parsedExpected.getTime()) {
      throw new ConflictException(
        'As configurações foram alteradas por outro administrador. Atualize a página antes de salvar novamente.',
      );
    }
  }

  private toAuditValue(
    key: keyof EditableSystemSettings,
    value: EditableSystemSettings[keyof EditableSystemSettings],
  ): string {
    if (
      key === 'aiEnabled' ||
      key === 'inAppNotificationsEnabled' ||
      key === 'symptomNotificationsEnabled'
    ) {
      return value ? 'Ativado' : 'Desativado';
    }

    return `${value}/100`;
  }
}
