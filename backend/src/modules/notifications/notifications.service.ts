import { Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationStatus,
  type AiPredictionRiskLevel,
  type CrisisPrediction,
  type Prisma,
} from '@prisma/client';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import { PrismaService } from '@/database/prisma.service';
import type { NotificationListResponseDto } from './dto/notification-list-response.dto';
import type { NotificationQueryDto } from './dto/notification-query.dto';
import type { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationType } from './enums/notification-type.enum';
import {
  notificationResponseSelect,
  type NotificationDetails,
} from './notifications.select';

interface CrisisAlertFactor {
  key: string;
  label?: string;
  contribution?: number;
}

interface AiAlertInput {
  id: string;
  userId: string;
  probabilityScore: number;
  riskLevel: AiPredictionRiskLevel;
  explanation: string;
  suggestedAction: string;
  triggerPatternLabels?: string[];
  repeatedCycles?: string[];
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrRefreshCrisisAlert(
    prediction: CrisisPrediction,
  ): Promise<void> {
    const riskScore = Math.round(prediction.probability * 100);

    if (riskScore < 70) {
      return;
    }

    const alertType = this.resolveAlertType(riskScore);
    const factorLabels = this.extractCrisisFactorLabels(prediction.riskFactors);
    const message = this.composeCrisisMessage(
      alertType,
      factorLabels,
      prediction.recommendationSummary,
    );

    await this.prisma.notification.upsert({
      where: {
        dedupeKey: `crisis-prediction:${prediction.id}`,
      },
      update: {
        type: alertType,
        title: 'Possível crise detectada',
        message,
        status: NotificationStatus.SENT,
        readAt: null,
        sentAt: new Date(),
        payload: {
          source: 'crisis_prediction',
          predictionId: prediction.id,
          riskScore,
          riskLevel: prediction.riskLevel,
          factorLabels,
          recommendationSummary: prediction.recommendationSummary,
        },
      },
      create: {
        userId: prediction.userId,
        crisisPredictionId: prediction.id,
        dedupeKey: `crisis-prediction:${prediction.id}`,
        type: alertType,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        title: 'Possível crise detectada',
        message,
        payload: {
          source: 'crisis_prediction',
          predictionId: prediction.id,
          riskScore,
          riskLevel: prediction.riskLevel,
          factorLabels,
          recommendationSummary: prediction.recommendationSummary,
        },
        sentAt: new Date(),
      },
    });
  }

  async createOrRefreshAiPredictionAlert(input: AiAlertInput): Promise<void> {
    if (input.probabilityScore < 70) {
      return;
    }

    const alertType = this.resolveAlertType(input.probabilityScore);
    const factorLabels =
      input.triggerPatternLabels?.slice(0, 3) ??
      input.repeatedCycles?.slice(0, 2) ??
      [];
    const message = this.composeAiMessage(
      alertType,
      factorLabels,
      input.explanation,
      input.suggestedAction,
    );

    await this.prisma.notification.upsert({
      where: {
        dedupeKey: `ai-prediction:${input.id}`,
      },
      update: {
        type: alertType,
        title: 'Possível crise detectada',
        message,
        status: NotificationStatus.SENT,
        readAt: null,
        sentAt: new Date(),
        payload: {
          source: 'ai_prediction',
          aiPredictionId: input.id,
          riskScore: input.probabilityScore,
          riskLevel: input.riskLevel,
          factorLabels,
          explanation: input.explanation,
          suggestedAction: input.suggestedAction,
        },
      },
      create: {
        userId: input.userId,
        dedupeKey: `ai-prediction:${input.id}`,
        type: alertType,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        title: 'Possível crise detectada',
        message,
        payload: {
          source: 'ai_prediction',
          aiPredictionId: input.id,
          riskScore: input.probabilityScore,
          riskLevel: input.riskLevel,
          factorLabels,
          explanation: input.explanation,
          suggestedAction: input.suggestedAction,
        },
        sentAt: new Date(),
      },
    });
  }

  async listForUser(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<NotificationListResponseDto> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where: Prisma.NotificationWhereInput = {
      userId,
      status: query.status,
      type: query.type,
      ...(query.unreadOnly
        ? {
            readAt: null,
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        select: notificationResponseSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapNotification(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async markAsRead(
    userId: string,
    id: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
      select: notificationResponseSelect,
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    const updated = await this.prisma.notification.update({
      where: {
        id,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: notification.readAt ?? new Date(),
      },
      select: notificationResponseSelect,
    });

    return this.mapNotification(updated);
  }

  private resolveAlertType(riskScore: number): NotificationType {
    if (riskScore >= 90) {
      return NotificationType.URGENT;
    }

    if (riskScore >= 80) {
      return NotificationType.WARNING;
    }

    return NotificationType.PREVENTIVE;
  }

  private composeCrisisMessage(
    alertType: NotificationType,
    factorLabels: string[],
    recommendationSummary: string | null,
  ): string {
    const prefix =
      alertType === NotificationType.URGENT
        ? 'Seu risco está muito elevado neste momento.'
        : alertType === NotificationType.WARNING
          ? 'Detectamos um risco elevado de piora nas próximas horas.'
          : 'Detectamos sinais iniciais de possível piora.';
    const factorText =
      factorLabels.length > 0
        ? ` Os fatores mais relevantes foram ${this.formatList(factorLabels)}.`
        : '';
    const action =
      recommendationSummary?.trim() ??
      this.defaultActionForAlertType(alertType);

    return `${prefix}${factorText} ${action}`.trim();
  }

  private composeAiMessage(
    alertType: NotificationType,
    factorLabels: string[],
    explanation: string,
    suggestedAction: string,
  ): string {
    const prefix =
      alertType === NotificationType.URGENT
        ? 'A análise inteligente detectou um padrão forte de crise iminente.'
        : alertType === NotificationType.WARNING
          ? 'A análise inteligente detectou um padrão de risco importante.'
          : 'A análise inteligente detectou sinais preventivos de piora.';
    const factorText =
      factorLabels.length > 0
        ? ` Os padrões mais marcantes foram ${this.formatList(factorLabels)}.`
        : '';

    return `${prefix}${factorText} ${explanation.trim()} ${suggestedAction.trim()}`.trim();
  }

  private extractCrisisFactorLabels(riskFactors: Prisma.JsonValue): string[] {
    if (!Array.isArray(riskFactors)) {
      return [];
    }

    return (riskFactors as unknown as CrisisAlertFactor[])
      .filter(
        (factor) =>
          typeof factor?.key === 'string' &&
          typeof factor?.contribution === 'number' &&
          factor.contribution > 0,
      )
      .sort(
        (left, right) => (right.contribution ?? 0) - (left.contribution ?? 0),
      )
      .slice(0, 3)
      .map((factor) => this.translateFactorLabel(factor.key, factor.label))
      .filter((label) => label.length > 0);
  }

  private translateFactorLabel(key: string, fallback?: string): string {
    const translations: Record<string, string> = {
      pain: 'sobrecarga corporal',
      fatigue: 'fadiga alta',
      stress: 'estresse elevado',
      sleep: 'pouco sono',
      mood: 'humor instavel',
      'symptom-burden': 'acumulo de sinais indiretos',
      hydration: 'baixa hidratacao',
    };

    return translations[key] ?? fallback?.trim() ?? key;
  }

  private defaultActionForAlertType(alertType: NotificationType): string {
    if (alertType === NotificationType.URGENT) {
      return 'Reduza o ritmo imediatamente, priorize descanso, hidratacao e procure apoio clinico se os sinais aumentarem.';
    }

    if (alertType === NotificationType.WARNING) {
      return 'Diminua a carga do dia, reforce hidratacao, sono e monitoramento dos sintomas.';
    }

    return 'Vale ajustar o ritmo, manter hidratacao e proteger o sono para evitar agravamento.';
  }

  private formatList(values: string[]): string {
    if (values.length === 0) {
      return '';
    }

    if (values.length === 1) {
      return values[0]!;
    }

    if (values.length === 2) {
      return `${values[0]!} e ${values[1]!}`;
    }

    return `${values.slice(0, -1).join(', ')} e ${values.at(-1)!}`;
  }

  private mapNotification(
    notification: NotificationDetails,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      read:
        notification.readAt !== null ||
        notification.status === NotificationStatus.READ,
      status: notification.status,
      channel: notification.channel,
      payload:
        notification.payload && typeof notification.payload === 'object'
          ? (notification.payload as Record<string, unknown>)
          : null,
      sentAt: notification.sentAt,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
