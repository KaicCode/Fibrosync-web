import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, type Prisma, Role, type User } from '@prisma/client';
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

interface CreateUserRecordInput {
  email: string;
  passwordHash: string;
  fullName: string;
  birthDate?: string | null;
  gender?: string | null;
  heightCm?: number;
  weightKg?: number;
  countryCode?: string | null;
  timezone?: string | null;
  role?: Role;
  accountStatus?: AccountStatus;
  specialty?: string | null;
  professionalCouncilType?: string | null;
  professionalCouncilNumber?: string | null;
  professionalCouncilState?: string | null;
  professionalPhone?: string | null;
  professionalClinic?: string | null;
  professionalBio?: string | null;
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

  async createPatient(input: CreateUserRecordInput): Promise<PublicUser> {
    const email = this.normalizeEmail(input.email);
    await this.ensureEmailAvailable(email);

    return this.createUserRecord({
      ...input,
      email,
      role: input.role ?? Role.USER,
      accountStatus: AccountStatus.ACTIVE,
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
    const role = dto.role ?? Role.USER;

    await this.ensureEmailAvailable(email);
    this.validateRoleSpecificPayload(role, dto);

    if (role === Role.MEDICAL) {
      await this.ensureProfessionalIdentityAvailable(
        dto.professionalCouncilType ?? null,
        dto.professionalCouncilNumber ?? null,
        dto.professionalCouncilState ?? null,
      );
    }

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
      role,
      accountStatus: this.resolveAccountStatus(role, dto.onboardingCompleted),
      specialty: dto.specialty ?? undefined,
      professionalCouncilType: dto.professionalCouncilType ?? undefined,
      professionalCouncilNumber: dto.professionalCouncilNumber ?? undefined,
      professionalCouncilState: dto.professionalCouncilState ?? undefined,
      professionalPhone: dto.professionalPhone ?? undefined,
      professionalClinic: dto.professionalClinic ?? undefined,
      professionalBio: dto.professionalBio ?? undefined,
      onboardingCompleted: this.resolveOnboardingCompleted(
        role,
        dto.onboardingCompleted,
      ),
    });
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    const existing = await this.findPublicById(userId);
    const isMedical = existing.role === Role.MEDICAL;

    if (isMedical) {
      await this.ensureProfessionalIdentityAvailable(
        dto.professionalCouncilType !== undefined
          ? dto.professionalCouncilType
          : existing.professionalCouncilType,
        dto.professionalCouncilNumber !== undefined
          ? dto.professionalCouncilNumber
          : existing.professionalCouncilNumber,
        dto.professionalCouncilState !== undefined
          ? dto.professionalCouncilState
          : existing.professionalCouncilState,
        userId,
      );
    }

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
      specialty: isMedical
        ? dto.specialty === undefined
          ? undefined
          : this.normalizeNullableText(dto.specialty)
        : undefined,
      professionalCouncilType: isMedical
        ? dto.professionalCouncilType === undefined
          ? undefined
          : this.normalizeNullableUppercaseText(dto.professionalCouncilType)
        : undefined,
      professionalCouncilNumber: isMedical
        ? dto.professionalCouncilNumber === undefined
          ? undefined
          : this.normalizeNullableText(dto.professionalCouncilNumber)
        : undefined,
      professionalCouncilState: isMedical
        ? dto.professionalCouncilState === undefined
          ? undefined
          : this.normalizeNullableUppercaseText(dto.professionalCouncilState)
        : undefined,
      professionalPhone: isMedical
        ? dto.professionalPhone === undefined
          ? undefined
          : this.normalizeNullableText(dto.professionalPhone)
        : undefined,
      professionalClinic: isMedical
        ? dto.professionalClinic === undefined
          ? undefined
          : this.normalizeNullableText(dto.professionalClinic)
        : undefined,
      professionalBio: isMedical
        ? dto.professionalBio === undefined
          ? undefined
          : this.normalizeNullableText(dto.professionalBio)
        : undefined,
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
    const nextRole = dto.role ?? existing.role;
    const nextEmail =
      dto.email !== undefined ? this.normalizeEmail(dto.email) : undefined;

    if (nextEmail && nextEmail !== existing.email) {
      await this.ensureEmailAvailable(nextEmail, userId);
    }

    const effectiveDoctorIdentity = {
      specialty:
        dto.specialty !== undefined ? dto.specialty : existing.specialty,
      professionalCouncilType:
        dto.professionalCouncilType !== undefined
          ? dto.professionalCouncilType
          : existing.professionalCouncilType,
      professionalCouncilNumber:
        dto.professionalCouncilNumber !== undefined
          ? dto.professionalCouncilNumber
          : existing.professionalCouncilNumber,
      professionalCouncilState:
        dto.professionalCouncilState !== undefined
          ? dto.professionalCouncilState
          : existing.professionalCouncilState,
      professionalClinic:
        dto.professionalClinic !== undefined
          ? dto.professionalClinic
          : existing.professionalClinic,
    };

    this.validateRoleSpecificPayload(nextRole, effectiveDoctorIdentity);

    if (nextRole === Role.MEDICAL) {
      await this.ensureProfessionalIdentityAvailable(
        effectiveDoctorIdentity.professionalCouncilType ?? null,
        effectiveDoctorIdentity.professionalCouncilNumber ?? null,
        effectiveDoctorIdentity.professionalCouncilState ?? null,
        userId,
      );
    }

    const passwordHash =
      dto.password !== undefined
        ? await this.hashPassword(dto.password)
        : undefined;

    const shouldUsePatientFields = nextRole === Role.USER;
    const shouldUseMedicalFields = nextRole === Role.MEDICAL;
    const onboardingCompletedUpdate = this.resolveOnboardingCompleted(
      nextRole,
      dto.onboardingCompleted,
    );
    const effectiveOnboardingCompleted =
      onboardingCompletedUpdate ?? existing.onboardingCompleted;

    const data: Prisma.UserUpdateInput = {
      email: nextEmail,
      passwordHash,
      fullName: dto.fullName?.trim(),
      birthDate: shouldUsePatientFields
        ? dto.birthDate === undefined
          ? undefined
          : dto.birthDate === null
            ? null
            : normalizeDateOnly(dto.birthDate)
        : null,
      gender: shouldUsePatientFields
        ? dto.gender === undefined
          ? undefined
          : this.normalizeNullableText(dto.gender)
        : null,
      heightCm: shouldUsePatientFields ? dto.heightCm : null,
      weightKg: shouldUsePatientFields ? dto.weightKg : null,
      countryCode:
        dto.countryCode === undefined
          ? undefined
          : dto.countryCode
            ? dto.countryCode.toUpperCase()
            : null,
      timezone:
        dto.timezone === undefined ? undefined : (dto.timezone?.trim() ?? null),
      role: nextRole,
      accountStatus: this.resolveAccountStatus(
        nextRole,
        effectiveOnboardingCompleted,
        existing.accountStatus,
      ),
      specialty: shouldUseMedicalFields
        ? dto.specialty === undefined
          ? undefined
          : this.normalizeNullableText(dto.specialty)
        : null,
      professionalCouncilType: shouldUseMedicalFields
        ? dto.professionalCouncilType === undefined
          ? undefined
          : this.normalizeNullableUppercaseText(dto.professionalCouncilType)
        : null,
      professionalCouncilNumber: shouldUseMedicalFields
        ? dto.professionalCouncilNumber === undefined
          ? undefined
          : this.normalizeNullableText(dto.professionalCouncilNumber)
        : null,
      professionalCouncilState: shouldUseMedicalFields
        ? dto.professionalCouncilState === undefined
          ? undefined
          : this.normalizeNullableUppercaseText(dto.professionalCouncilState)
        : null,
      professionalPhone: shouldUseMedicalFields
        ? dto.professionalPhone === undefined
          ? undefined
          : this.normalizeNullableText(dto.professionalPhone)
        : null,
      professionalClinic: shouldUseMedicalFields
        ? dto.professionalClinic === undefined
          ? undefined
          : this.normalizeNullableText(dto.professionalClinic)
        : null,
      professionalBio: shouldUseMedicalFields
        ? dto.professionalBio === undefined
          ? undefined
          : this.normalizeNullableText(dto.professionalBio)
        : null,
      onboardingCompleted: onboardingCompletedUpdate,
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

  private normalizeNullableUppercaseText(
    value?: string | null,
  ): string | null | undefined {
    const normalized = this.normalizeNullableText(value);

    if (normalized === undefined || normalized === null) {
      return normalized;
    }

    return normalized.toUpperCase();
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
      throw new ConflictException(
        'Ja existe uma conta cadastrada com este e-mail.',
      );
    }
  }

  private async ensureProfessionalIdentityAvailable(
    professionalCouncilType?: string | null,
    professionalCouncilNumber?: string | null,
    professionalCouncilState?: string | null,
    currentUserId?: string,
  ): Promise<void> {
    const councilType = this.normalizeNullableUppercaseText(
      professionalCouncilType,
    );
    const councilNumber = this.normalizeNullableText(professionalCouncilNumber);
    const councilState = this.normalizeNullableUppercaseText(
      professionalCouncilState,
    );

    if (!councilType || !councilNumber || !councilState) {
      return;
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        professionalCouncilType: councilType,
        professionalCouncilNumber: councilNumber,
        professionalCouncilState: councilState,
      },
      select: {
        id: true,
      },
    });

    if (existingUser && existingUser.id !== currentUserId) {
      throw new ConflictException(
        'Ja existe um profissional cadastrado com este registro.',
      );
    }
  }

  private validateRoleSpecificPayload(
    role: Role,
    input: {
      specialty?: string | null;
      professionalCouncilType?: string | null;
      professionalCouncilNumber?: string | null;
      professionalCouncilState?: string | null;
    },
  ): void {
    if (role !== Role.MEDICAL) {
      return;
    }

    const specialty = this.normalizeNullableText(input.specialty);
    const councilType = this.normalizeNullableUppercaseText(
      input.professionalCouncilType,
    );
    const councilNumber = this.normalizeNullableText(
      input.professionalCouncilNumber,
    );
    const councilState = this.normalizeNullableUppercaseText(
      input.professionalCouncilState,
    );

    if (!specialty || !councilType || !councilNumber || !councilState) {
      throw new BadRequestException(
        'Preencha especialidade, conselho profissional, numero do registro e UF do conselho para criar uma conta medica.',
      );
    }
  }

  private resolveOnboardingCompleted(
    role: Role,
    onboardingCompleted?: boolean,
  ): boolean | undefined {
    if (role === Role.ADMIN) {
      return true;
    }

    return onboardingCompleted;
  }

  private resolveAccountStatus(
    role: Role,
    onboardingCompleted?: boolean,
    currentStatus?: AccountStatus,
  ): AccountStatus {
    if (role !== Role.MEDICAL) {
      return AccountStatus.ACTIVE;
    }

    if (currentStatus === AccountStatus.SUSPENDED) {
      return AccountStatus.SUSPENDED;
    }

    return onboardingCompleted
      ? AccountStatus.ACTIVE
      : AccountStatus.PENDING_PROFILE;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptSaltRounds);
  }

  private createUserRecord(input: CreateUserRecordInput): Promise<PublicUser> {
    const role = input.role ?? Role.USER;
    const isPatient = role === Role.USER;
    const isMedical = role === Role.MEDICAL;

    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        fullName: input.fullName.trim(),
        birthDate:
          isPatient && input.birthDate
            ? normalizeDateOnly(input.birthDate)
            : undefined,
        gender: isPatient
          ? (this.normalizeNullableText(input.gender) ?? undefined)
          : undefined,
        heightCm: isPatient ? input.heightCm : undefined,
        weightKg: isPatient ? input.weightKg : undefined,
        countryCode:
          this.normalizeNullableUppercaseText(input.countryCode) ?? undefined,
        timezone: input.timezone?.trim() ?? 'America/Sao_Paulo',
        role,
        accountStatus:
          input.accountStatus ??
          this.resolveAccountStatus(role, input.onboardingCompleted),
        specialty: isMedical
          ? (this.normalizeNullableText(input.specialty) ?? undefined)
          : undefined,
        professionalCouncilType: isMedical
          ? (this.normalizeNullableUppercaseText(
              input.professionalCouncilType,
            ) ?? undefined)
          : undefined,
        professionalCouncilNumber: isMedical
          ? (this.normalizeNullableText(input.professionalCouncilNumber) ??
            undefined)
          : undefined,
        professionalCouncilState: isMedical
          ? (this.normalizeNullableUppercaseText(
              input.professionalCouncilState,
            ) ?? undefined)
          : undefined,
        professionalPhone: isMedical
          ? (this.normalizeNullableText(input.professionalPhone) ?? undefined)
          : undefined,
        professionalClinic: isMedical
          ? (this.normalizeNullableText(input.professionalClinic) ?? undefined)
          : undefined,
        professionalBio: isMedical
          ? (this.normalizeNullableText(input.professionalBio) ?? undefined)
          : undefined,
        onboardingCompleted: this.resolveOnboardingCompleted(
          role,
          input.onboardingCompleted,
        ),
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
