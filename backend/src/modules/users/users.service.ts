import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/database/prisma.service';
import { normalizeDateOnly } from '@/common/utils/date.util';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import type { CreateAdminUserDto } from './dto/create-admin-user.dto';
import type { UpdateAdminUserDto } from './dto/update-admin-user.dto';
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
  role?: Role;
  onboardingCompleted?: boolean;
}

@Injectable()
export class UsersService {
  private readonly bcryptSaltRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.bcryptSaltRounds = configService.get<number>(
      'auth.bcryptSaltRounds',
      12,
    );
  }

  async createPatient(input: CreatePatientInput): Promise<PublicUser> {
    const email = this.normalizeEmail(input.email);
    await this.ensureEmailAvailable(email);

    return this.createUserRecord({
      ...input,
      email,
      role: input.role,
      onboardingCompleted: input.onboardingCompleted,
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

  async createAdminUser(dto: CreateAdminUserDto): Promise<PublicUser> {
    const email = this.normalizeEmail(dto.email);
    await this.ensureEmailAvailable(email);

    const passwordHash = await this.hashPassword(dto.password);

    return this.createUserRecord({
      email,
      passwordHash,
      fullName: dto.fullName,
      birthDate: dto.birthDate,
      gender: dto.gender ?? undefined,
      heightCm: dto.heightCm ?? undefined,
      weightKg: dto.weightKg ?? undefined,
      countryCode: dto.countryCode ?? undefined,
      timezone: dto.timezone,
      role: dto.role,
      onboardingCompleted: dto.onboardingCompleted,
    });
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

  async updateUserByAdmin(
    userId: string,
    dto: UpdateAdminUserDto,
  ): Promise<PublicUser> {
    const existing = await this.findPublicById(userId);
    const nextEmail =
      dto.email !== undefined ? this.normalizeEmail(dto.email) : undefined;

    if (nextEmail && nextEmail !== existing.email) {
      await this.ensureEmailAvailable(nextEmail, userId);
    }

    const passwordHash =
      dto.password !== undefined
        ? await this.hashPassword(dto.password)
        : undefined;

    const data: Prisma.UserUpdateInput = {
      email: nextEmail,
      passwordHash,
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
      role: dto.role,
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

  async softDeleteUser(
    adminUserId: string,
    userId: string,
  ): Promise<{ message: string }> {
    if (adminUserId === userId) {
      throw new BadRequestException(
        'Administrators cannot delete their own account.',
      );
    }

    await this.findPublicById(userId);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          deletedAt: new Date(),
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    return {
      message: 'User account deleted successfully.',
    };
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

  private normalizeNullableText(
    value?: string | null,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private normalizeNullableTime(
    value?: string | null,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private async ensureEmailAvailable(
    email: string,
    currentUserId?: string,
  ): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser && existingUser.id !== currentUserId) {
      throw new ConflictException('A user with this email already exists.');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptSaltRounds);
  }

  private createUserRecord(input: CreatePatientInput): Promise<PublicUser> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        fullName: input.fullName.trim(),
        birthDate: input.birthDate
          ? normalizeDateOnly(input.birthDate)
          : undefined,
        gender: this.normalizeNullableText(input.gender) ?? undefined,
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        countryCode: input.countryCode?.toUpperCase(),
        timezone: input.timezone?.trim() ?? 'America/Sao_Paulo',
        role: input.role,
        onboardingCompleted: input.onboardingCompleted,
      },
      select: userPublicSelect,
    });
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
