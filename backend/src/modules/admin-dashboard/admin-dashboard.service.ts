import { Injectable, Logger } from '@nestjs/common';
import {
  AccountStatus,
  Prisma,
  ReportStatus,
  Role,
} from '@prisma/client';
import { addDays, normalizeDateOnly } from '@/common/utils/date.util';
import { PrismaService } from '@/database/prisma.service';
import type {
  AdminDashboardActivity,
  AdminDashboardGrowth,
  AdminDashboardIssue,
  AdminDashboardIssueSection,
  AdminDashboardOverview,
  AdminDashboardPending,
  AdminDashboardPlatformStatus,
  AdminDashboardProfessionals,
  AdminDashboardRecentActivity,
  AdminDashboardRecentActivityItem,
  AdminDashboardResponse,
} from './admin-dashboard.types';

type SectionResult<T> = {
  data: T | null;
  issue?: AdminDashboardIssue;
};

type UserGrowthRow = {
  date: Date;
  total: number;
  patients: number;
  professionals: number;
};

type RecordGrowthRow = {
  date: Date;
  total: number;
};

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);
  private readonly activeUsersWindowDays = 30;

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(
    requestedPeriodDays?: 7 | 30 | 90,
  ): Promise<AdminDashboardResponse> {
    const periodDays = requestedPeriodDays ?? 30;
    const today = normalizeDateOnly(new Date());
    const periodStart = addDays(today, -(periodDays - 1));
    const periodEndExclusive = addDays(today, 1);
    const previousPeriodStart = addDays(periodStart, -periodDays);
    const activeUsersSince = addDays(today, -(this.activeUsersWindowDays - 1));

    const issues: AdminDashboardIssue[] = [];

    const [
      overviewResult,
      growthResult,
      activityResult,
      professionalsResult,
      recentActivityResult,
      pendingResult,
      platformStatusResult,
    ] = await Promise.all([
      this.captureSection('overview', () =>
        this.buildOverview(
          periodStart,
          periodEndExclusive,
          previousPeriodStart,
          periodStart,
          activeUsersSince,
        ),
      ),
      this.captureSection('growth', () =>
        this.buildGrowth(periodStart, today),
      ),
      this.captureSection('activity', () =>
        this.buildActivity(periodStart, periodEndExclusive, today),
      ),
      this.captureSection('professionals', () => this.buildProfessionals()),
      this.captureSection('recentActivity', () => this.buildRecentActivity()),
      this.captureSection('pending', () => this.buildPending()),
      this.captureSection('platformStatus', () => this.buildPlatformStatus()),
    ]);

    for (const result of [
      overviewResult,
      growthResult,
      activityResult,
      professionalsResult,
      recentActivityResult,
      pendingResult,
      platformStatusResult,
    ]) {
      if (result.issue) {
        issues.push(result.issue);
      }
    }

    const distribution = overviewResult.data
      ? {
          patients: overviewResult.data.patients,
          professionals: overviewResult.data.professionals,
          admins: overviewResult.data.admins,
        }
      : null;

    return {
      generatedAt: new Date().toISOString(),
      periodDays,
      activeUsersWindowDays: this.activeUsersWindowDays,
      overview: overviewResult.data,
      distribution,
      growth: growthResult.data,
      activity: activityResult.data,
      professionals: professionalsResult.data,
      recentActivity: recentActivityResult.data,
      pending: pendingResult.data,
      platformStatus: platformStatusResult.data,
      issues,
    };
  }

  private async captureSection<T>(
    section: AdminDashboardIssueSection,
    handler: () => Promise<T>,
  ): Promise<SectionResult<T>> {
    try {
      return {
        data: await handler(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to build admin dashboard section "${section}".`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        data: null,
        issue: {
          section,
          message: 'Nao foi possivel carregar esta informacao.',
        },
      };
    }
  }

  private async buildOverview(
    periodStart: Date,
    periodEndExclusive: Date,
    previousPeriodStart: Date,
    previousPeriodEndExclusive: Date,
    activeUsersSince: Date,
  ): Promise<AdminDashboardOverview> {
    const [
      totalUsers,
      patients,
      professionals,
      admins,
      activeUsers,
      newUsersInPeriod,
      previousUsers,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({
        where: {
          deletedAt: null,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: Role.USER,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: Role.MEDICAL,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: Role.ADMIN,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          lastLoginAt: {
            gte: activeUsersSince,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: periodStart,
            lt: periodEndExclusive,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: previousPeriodStart,
            lt: previousPeriodEndExclusive,
          },
        },
      }),
    ]);

    return {
      totalUsers,
      patients,
      professionals,
      admins,
      activeUsers,
      activeUsersDefinition: `Login nos ultimos ${this.activeUsersWindowDays} dias`,
      newUsersInPeriod,
      newUsersPreviousPeriod: previousUsers,
      newUsersChangePercent:
        previousUsers > 0
          ? Number(
              (
                ((newUsersInPeriod - previousUsers) / previousUsers) *
                100
              ).toFixed(1),
            )
          : null,
    };
  }

  private async buildGrowth(
    periodStart: Date,
    periodEnd: Date,
  ): Promise<AdminDashboardGrowth> {
    const rows = await this.prisma.$queryRaw<UserGrowthRow[]>(Prisma.sql`
      SELECT
        day::date AS date,
        COALESCE(COUNT(u.id), 0)::int AS total,
        COALESCE(COUNT(*) FILTER (WHERE u.role = 'USER'), 0)::int AS patients,
        COALESCE(COUNT(*) FILTER (WHERE u.role = 'MEDICAL'), 0)::int AS professionals
      FROM generate_series(${periodStart}::date, ${periodEnd}::date, interval '1 day') AS day
      LEFT JOIN users u
        ON DATE(u.created_at) = day::date
       AND u.deleted_at IS NULL
      GROUP BY day
      ORDER BY day ASC
    `);

    return {
      series: rows.map((row) => ({
        date: this.toDateOnly(row.date),
        total: row.total,
        patients: row.patients,
        professionals: row.professionals,
      })),
    };
  }

  private async buildActivity(
    periodStart: Date,
    periodEndExclusive: Date,
    periodEnd: Date,
  ): Promise<AdminDashboardActivity> {
    const [totalRecords, recordsInPeriod, patientsWithRecordsInPeriod, series] =
      await Promise.all([
        this.prisma.dailyRecord.count(),
        this.prisma.dailyRecord.count({
          where: {
            recordDate: {
              gte: periodStart,
              lt: periodEndExclusive,
            },
          },
        }),
        this.prisma.dailyRecord.groupBy({
          by: ['userId'],
          where: {
            recordDate: {
              gte: periodStart,
              lt: periodEndExclusive,
            },
            user: {
              deletedAt: null,
              role: Role.USER,
            },
          },
        }),
        this.prisma.$queryRaw<RecordGrowthRow[]>(Prisma.sql`
          SELECT
            day::date AS date,
            COALESCE(COUNT(r.id), 0)::int AS total
          FROM generate_series(${periodStart}::date, ${periodEnd}::date, interval '1 day') AS day
          LEFT JOIN daily_records r
            ON r.record_date = day::date
          GROUP BY day
          ORDER BY day ASC
        `),
      ]);

    return {
      totalRecords,
      recordsInPeriod,
      patientsWithRecordsInPeriod: patientsWithRecordsInPeriod.length,
      series: series.map((row) => ({
        date: this.toDateOnly(row.date),
        total: row.total,
      })),
    };
  }

  private async buildProfessionals(): Promise<AdminDashboardProfessionals> {
    const [total, active, pending, suspended, pendingItems] =
      await this.prisma.$transaction([
        this.prisma.user.count({
          where: {
            deletedAt: null,
            role: Role.MEDICAL,
          },
        }),
        this.prisma.user.count({
          where: {
            deletedAt: null,
            role: Role.MEDICAL,
            accountStatus: AccountStatus.ACTIVE,
          },
        }),
        this.prisma.user.count({
          where: {
            deletedAt: null,
            role: Role.MEDICAL,
            accountStatus: AccountStatus.PENDING_PROFILE,
          },
        }),
        this.prisma.user.count({
          where: {
            deletedAt: null,
            role: Role.MEDICAL,
            accountStatus: AccountStatus.SUSPENDED,
          },
        }),
        this.prisma.user.findMany({
          where: {
            deletedAt: null,
            role: Role.MEDICAL,
            accountStatus: AccountStatus.PENDING_PROFILE,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 4,
          select: {
            id: true,
            fullName: true,
            specialty: true,
            createdAt: true,
            accountStatus: true,
          },
        }),
      ]);

    return {
      total,
      active,
      pending,
      suspended,
      pendingItems: pendingItems.map((item) => ({
        id: item.id,
        fullName: item.fullName,
        specialty: item.specialty ?? null,
        createdAt: item.createdAt.toISOString(),
        accountStatus: 'PENDING_PROFILE',
      })),
    };
  }

  private async buildRecentActivity(): Promise<AdminDashboardRecentActivity> {
    const [recentUsers, recentlyConfiguredProfessionals] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 6,
        select: {
          id: true,
          fullName: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.user.findMany({
        where: {
          deletedAt: null,
          role: Role.MEDICAL,
          onboardingCompleted: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 8,
        select: {
          id: true,
          fullName: true,
          specialty: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
    ]);

    const items: AdminDashboardRecentActivityItem[] = [
      ...recentUsers.map((user) => ({
        id: `created-${user.id}`,
        type: 'USER_CREATED' as const,
        title: this.resolveCreatedUserTitle(user.role),
        description: `${user.fullName} entrou para a plataforma.`,
        occurredAt: user.createdAt.toISOString(),
      })),
      ...recentlyConfiguredProfessionals
        .filter((item) => item.updatedAt.getTime() !== item.createdAt.getTime())
        .map((item) => ({
          id: `configured-${item.id}`,
          type: 'PROFESSIONAL_COMPLETED_PROFILE' as const,
          title: 'Profissional concluiu a configuracao',
          description: item.specialty
            ? `${item.fullName} finalizou a conta profissional em ${item.specialty}.`
            : `${item.fullName} finalizou a conta profissional.`,
          occurredAt: item.updatedAt.toISOString(),
        })),
    ]
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      )
      .slice(0, 8);

    return {
      items,
    };
  }

  private async buildPending(): Promise<AdminDashboardPending> {
    const [pendingProfessionals, suspendedUsers, failedReports] = await Promise.all([
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: Role.MEDICAL,
          accountStatus: AccountStatus.PENDING_PROFILE,
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          accountStatus: AccountStatus.SUSPENDED,
        },
      }),
      this.prisma.report.count({
        where: {
          status: ReportStatus.FAILED,
        },
      }),
    ]);

    const items: AdminDashboardPending['items'] = [];

    if (pendingProfessionals > 0) {
      items.push({
        id: 'pending-professionals',
        title: 'Profissionais aguardando configuracao',
        description: `${pendingProfessionals} conta(s) profissional(is) ainda precisam concluir o perfil.`,
        status: 'Perfil incompleto',
      });
    }

    if (suspendedUsers > 0) {
      items.push({
        id: 'suspended-users',
        title: 'Contas suspensas',
        description: `${suspendedUsers} conta(s) estao com acesso suspenso no momento.`,
        status: 'Revisao recomendada',
      });
    }

    if (failedReports > 0) {
      items.push({
        id: 'failed-reports',
        title: 'Falhas recentes de relatorio',
        description: `${failedReports} relatorio(s) ficaram com status de falha.`,
        status: 'Acompanhar',
      });
    }

    return {
      items,
    };
  }

  private async buildPlatformStatus(): Promise<AdminDashboardPlatformStatus> {
    await this.prisma.$queryRawUnsafe('select 1');

    return {
      api: 'operational',
      database: 'operational',
      checkedAt: new Date().toISOString(),
    };
  }

  private resolveCreatedUserTitle(role: Role): string {
    if (role === Role.ADMIN) {
      return 'Novo administrador cadastrado';
    }

    if (role === Role.MEDICAL) {
      return 'Conta profissional criada';
    }

    return 'Novo paciente cadastrado';
  }

  private toDateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
