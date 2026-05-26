import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { normalizeDateOnly } from '@/common/utils/date.util';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import type { UserQueryDto } from './dto/user-query.dto';
import type { PublicUser } from './users.select';
import { userPublicSelect } from './users.select';
import type { UserSettingsResponseDto } from './dto/user-settings-response.dto';
import {
  type UserSettingsDetails,
  userSettingsSelect,
} from './users-settings.select';

interface CreatePatientInput {
  email: string;
  passwordHash: string;
  fullName: string;
  birthDate?: string;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  countryCode?: string;
  timezone?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createPatient(input: CreatePatientInput): Promise<PublicUser> {
    const email = input.email.toLowerCase().trim();
    const exists = await this.findByEmail(email);

    if (exists) {
      throw new ConflictException('A user with this email already exists.');
    }

    return this.prisma.user.create({
      data: {
        email,
        passwordHash: input.passwordHash,
        fullName: input.fullName.trim(),
        birthDate: input.birthDate
          ? normalizeDateOnly(input.birthDate)
          : undefined,
        gender: input.gender?.trim(),
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        countryCode: input.countryCode?.toUpperCase(),
        timezone: input.timezone?.trim() ?? 'America/Sao_Paulo',
      },
      select: userPublicSelect,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        deletedAt: null,
      },
    });
  }

  async findPublicById(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: userPublicSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async markLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async getProfile(userId: string): Promise<PublicUser> {
    return this.findPublicById(userId);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    await this.findPublicById(userId);

    const data: Prisma.UserUpdateInput = {
      fullName: dto.fullName?.trim(),
      birthDate:
        dto.birthDate === undefined
          ? undefined
          : dto.birthDate === null
            ? null
            : normalizeDateOnly(dto.birthDate),
      gender:
        dto.gender === undefined
          ? undefined
          : this.normalizeNullableText(dto.gender),
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      countryCode:
        dto.countryCode === undefined
          ? undefined
          : dto.countryCode
            ? dto.countryCode.toUpperCase()
            : null,
      timezone: dto.timezone?.trim(),
      onboardingCompleted: dto.onboardingCompleted,
    };

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data,
      select: userPublicSelect,
    });
  }

  async getSettings(userId: string): Promise<UserSettingsResponseDto> {
    const settings = await this.ensureSettings(userId);
    return this.mapSettings(settings);
  }

  async updateSettings(
    userId: string,
    dto: UpdateUserSettingsDto,
  ): Promise<UserSettingsResponseDto> {
    await this.findPublicById(userId);

    const settings = await this.prisma.userSettings.upsert({
      where: {
        userId,
      },
      update: {
        dailySummaryEnabled: dto.dailySummaryEnabled,
        dailySummaryTime: dto.dailySummaryTime?.trim(),
        endOfDayReminderEnabled: dto.endOfDayReminderEnabled,
        endOfDayReminderTime: dto.endOfDayReminderTime?.trim(),
        smartSearchEnabled: dto.smartSearchEnabled,
        calendarInsightsEnabled: dto.calendarInsightsEnabled,
        inAppNotificationsEnabled: dto.inAppNotificationsEnabled,
        emailNotificationsEnabled: dto.emailNotificationsEnabled,
        quietHoursEnabled: dto.quietHoursEnabled,
        quietHoursStart:
          dto.quietHoursStart === undefined
            ? undefined
            : this.normalizeNullableTime(dto.quietHoursStart),
        quietHoursEnd:
          dto.quietHoursEnd === undefined
            ? undefined
            : this.normalizeNullableTime(dto.quietHoursEnd),
        clinicalDataSharingEnabled: dto.clinicalDataSharingEnabled,
        reportExportConfirmationEnabled: dto.reportExportConfirmationEnabled,
        deviceProtectionEnabled: dto.deviceProtectionEnabled,
        permissionReviewEnabled: dto.permissionReviewEnabled,
      },
      create: {
        userId,
        dailySummaryEnabled: dto.dailySummaryEnabled ?? true,
        dailySummaryTime: dto.dailySummaryTime?.trim() ?? '08:00',
        endOfDayReminderEnabled: dto.endOfDayReminderEnabled ?? true,
        endOfDayReminderTime: dto.endOfDayReminderTime?.trim() ?? '20:00',
        smartSearchEnabled: dto.smartSearchEnabled ?? true,
        calendarInsightsEnabled: dto.calendarInsightsEnabled ?? true,
        inAppNotificationsEnabled: dto.inAppNotificationsEnabled ?? true,
        emailNotificationsEnabled: dto.emailNotificationsEnabled ?? false,
        quietHoursEnabled: dto.quietHoursEnabled ?? false,
        quietHoursStart: this.normalizeNullableTime(dto.quietHoursStart),
        quietHoursEnd: this.normalizeNullableTime(dto.quietHoursEnd),
        clinicalDataSharingEnabled: dto.clinicalDataSharingEnabled ?? false,
        reportExportConfirmationEnabled:
          dto.reportExportConfirmationEnabled ?? true,
        deviceProtectionEnabled: dto.deviceProtectionEnabled ?? true,
        permissionReviewEnabled: dto.permissionReviewEnabled ?? true,
      },
      select: userSettingsSelect,
    });

    return this.mapSettings(settings);
  }

  async listUsers(query: UserQueryDto): Promise<{
    items: PublicUser[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      role: query.role,
      ...(query.search
        ? {
            OR: [
              {
                email: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                fullName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userPublicSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  private async ensureSettings(userId: string): Promise<UserSettingsDetails> {
    await this.findPublicById(userId);

    return this.prisma.userSettings.upsert({
      where: {
        userId,
      },
      update: {},
      create: {
        userId,
      },
      select: userSettingsSelect,
    });
  }

  private normalizeNullableText(value?: string | null): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private normalizeNullableTime(value?: string | null): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private mapSettings(settings: UserSettingsDetails): UserSettingsResponseDto {
    return {
      id: settings.id,
      dailySummaryEnabled: settings.dailySummaryEnabled,
      dailySummaryTime: settings.dailySummaryTime,
      endOfDayReminderEnabled: settings.endOfDayReminderEnabled,
      endOfDayReminderTime: settings.endOfDayReminderTime,
      smartSearchEnabled: settings.smartSearchEnabled,
      calendarInsightsEnabled: settings.calendarInsightsEnabled,
      inAppNotificationsEnabled: settings.inAppNotificationsEnabled,
      emailNotificationsEnabled: settings.emailNotificationsEnabled,
      quietHoursEnabled: settings.quietHoursEnabled,
      quietHoursStart: settings.quietHoursStart,
      quietHoursEnd: settings.quietHoursEnd,
      clinicalDataSharingEnabled: settings.clinicalDataSharingEnabled,
      reportExportConfirmationEnabled: settings.reportExportConfirmationEnabled,
      deviceProtectionEnabled: settings.deviceProtectionEnabled,
      permissionReviewEnabled: settings.permissionReviewEnabled,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }
}
