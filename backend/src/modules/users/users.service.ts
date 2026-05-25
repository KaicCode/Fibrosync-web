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
import type { UserQueryDto } from './dto/user-query.dto';
import type { PublicUser } from './users.select';
import { userPublicSelect } from './users.select';

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
      birthDate: dto.birthDate ? normalizeDateOnly(dto.birthDate) : undefined,
      gender: dto.gender?.trim(),
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      countryCode: dto.countryCode?.toUpperCase(),
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
}
