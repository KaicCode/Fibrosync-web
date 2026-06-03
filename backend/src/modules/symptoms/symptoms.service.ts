import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { addDays, normalizeDateOnly } from '@/common/utils/date.util';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import { PrismaService } from '@/database/prisma.service';
import type { AdminCreateSymptomDto } from './dto/admin-create-symptom.dto';
import type { AdminSymptomQueryDto } from './dto/admin-symptom-query.dto';
import type { CreateSymptomDto } from './dto/create-symptom.dto';
import type { SymptomListResponseDto } from './dto/symptom-list-response.dto';
import type { SymptomResponseDto } from './dto/symptom-response.dto';
import type { SymptomQueryDto } from './dto/symptom-query.dto';
import type { UpdateSymptomDto } from './dto/update-symptom.dto';
import {
  type AdminSymptomSignalDetails,
  adminSymptomSignalResponseSelect,
  type SymptomSignalDetails,
  symptomSignalResponseSelect,
} from './symptoms.select';

interface AdminMappedSymptomSignal {
  id: string;
  userId: string;
  dailyRecordId: string | null;
  fatigueLevel: number;
  sleepQuality: number;
  stiffness: number;
  mood: number;
  stress: number;
  cognitiveFog: boolean;
  sensitivityLight: boolean;
  sensitivityNoise: boolean;
  digestiveIssues: boolean;
  headache: boolean;
  anxiety: boolean;
  depression: boolean;
  bodyTemperatureFeeling: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface SymptomSignalMutationData {
  userId?: string;
  fatigueLevel?: number;
  sleepQuality?: number;
  stiffness?: number;
  mood?: number;
  stress?: number;
  cognitiveFog?: boolean;
  sensitivityLight?: boolean;
  sensitivityNoise?: boolean;
  digestiveIssues?: boolean;
  headache?: boolean;
  anxiety?: boolean;
  depression?: boolean;
  bodyTemperatureFeeling?: string;
  notes?: string;
}

@Injectable()
export class SymptomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateSymptomDto,
  ): Promise<SymptomResponseDto> {
    await this.ensureUserExists(userId);

    const signal = await this.prisma.symptomSignal.create({
      data: this.buildCreateSignalMutationData(userId, dto),
      select: symptomSignalResponseSelect,
    });

    return this.mapSignal(signal);
  }

  async listForUser(
    userId: string,
    query: SymptomQueryDto,
  ): Promise<SymptomListResponseDto> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where: Prisma.SymptomSignalWhereInput = {
      userId,
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              gte: query.dateFrom
                ? normalizeDateOnly(query.dateFrom)
                : undefined,
              lt: query.dateTo
                ? addDays(normalizeDateOnly(query.dateTo), 1)
                : undefined,
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.symptomSignal.findMany({
        where,
        select: symptomSignalResponseSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.symptomSignal.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapSignal(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findOneForUser(
    userId: string,
    id: string,
  ): Promise<SymptomResponseDto> {
    const signal = await this.prisma.symptomSignal.findFirst({
      where: {
        id,
        userId,
      },
      select: symptomSignalResponseSelect,
    });

    if (!signal) {
      throw new NotFoundException('Symptoms record not found.');
    }

    return this.mapSignal(signal);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateSymptomDto,
  ): Promise<SymptomResponseDto> {
    await this.ensureExists(userId, id);

    const signal = await this.prisma.symptomSignal.update({
      where: {
        id,
      },
      data: this.buildUpdateSignalMutationData(dto),
      select: symptomSignalResponseSelect,
    });

    return this.mapSignal(signal);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    await this.ensureExists(userId, id);

    await this.prisma.symptomSignal.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Symptoms record deleted successfully.',
    };
  }

  async createForAdmin(
    dto: AdminCreateSymptomDto,
  ): Promise<AdminMappedSymptomSignal> {
    await this.ensureUserExists(dto.userId);

    const signal = await this.prisma.symptomSignal.create({
      data: this.buildCreateSignalMutationData(dto.userId, dto),
      select: adminSymptomSignalResponseSelect,
    });

    return this.mapAdminSignal(signal);
  }

  async listForAdmin(query: AdminSymptomQueryDto): Promise<{
    items: AdminMappedSymptomSignal[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const normalizedSearch = query.search?.trim();
    const where: Prisma.SymptomSignalWhereInput = {
      ...(query.userId
        ? {
            userId: query.userId,
          }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              gte: query.dateFrom
                ? normalizeDateOnly(query.dateFrom)
                : undefined,
              lt: query.dateTo
                ? addDays(normalizeDateOnly(query.dateTo), 1)
                : undefined,
            },
          }
        : {}),
      ...(normalizedSearch
        ? {
            OR: [
              {
                notes: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
              {
                bodyTemperatureFeeling: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
              {
                user: {
                  is: {
                    fullName: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                user: {
                  is: {
                    email: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.symptomSignal.findMany({
        where,
        select: adminSymptomSignalResponseSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.symptomSignal.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapAdminSignal(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findOneForAdmin(id: string): Promise<AdminMappedSymptomSignal> {
    const signal = await this.prisma.symptomSignal.findUnique({
      where: {
        id,
      },
      select: adminSymptomSignalResponseSelect,
    });

    if (!signal) {
      throw new NotFoundException('Symptoms record not found.');
    }

    return this.mapAdminSignal(signal);
  }

  async updateForAdmin(
    id: string,
    dto: UpdateSymptomDto,
  ): Promise<AdminMappedSymptomSignal> {
    const existing = await this.findOneForAdmin(id);

    if (existing.dailyRecordId) {
      throw new BadRequestException(
        'Symptom signals linked to daily records must be managed through the daily record workflow.',
      );
    }

    const signal = await this.prisma.symptomSignal.update({
      where: {
        id,
      },
      data: this.buildUpdateSignalMutationData(dto),
      select: adminSymptomSignalResponseSelect,
    });

    return this.mapAdminSignal(signal);
  }

  async removeForAdmin(id: string): Promise<{ message: string }> {
    const existing = await this.findOneForAdmin(id);

    if (existing.dailyRecordId) {
      throw new BadRequestException(
        'Symptom signals linked to daily records must be managed through the daily record workflow.',
      );
    }

    await this.prisma.symptomSignal.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Symptoms record deleted successfully.',
    };
  }

  private async ensureExists(userId: string, id: string): Promise<void> {
    const signal = await this.prisma.symptomSignal.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!signal) {
      throw new NotFoundException('Symptoms record not found.');
    }
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }
  }

  private buildCreateSignalMutationData(
    userId: string,
    dto: CreateSymptomDto,
  ): Prisma.SymptomSignalUncheckedCreateInput {
    return {
      userId,
      fatigueLevel: dto.fatigueLevel,
      sleepQuality: dto.sleepQuality,
      stiffness: dto.stiffness,
      mood: dto.mood,
      stress: dto.stress,
      cognitiveFog: dto.cognitiveFog,
      sensitivityLight: dto.sensitivityLight,
      sensitivityNoise: dto.sensitivityNoise,
      digestiveIssues: dto.digestiveIssues,
      headache: dto.headache,
      anxiety: dto.anxiety,
      depression: dto.depression,
      bodyTemperatureFeeling: dto.bodyTemperatureFeeling?.trim(),
      notes: dto.notes?.trim(),
    };
  }

  private buildUpdateSignalMutationData(
    dto: UpdateSymptomDto,
  ): SymptomSignalMutationData {
    return {
      fatigueLevel: dto.fatigueLevel,
      sleepQuality: dto.sleepQuality,
      stiffness: dto.stiffness,
      mood: dto.mood,
      stress: dto.stress,
      cognitiveFog: dto.cognitiveFog,
      sensitivityLight: dto.sensitivityLight,
      sensitivityNoise: dto.sensitivityNoise,
      digestiveIssues: dto.digestiveIssues,
      headache: dto.headache,
      anxiety: dto.anxiety,
      depression: dto.depression,
      bodyTemperatureFeeling: dto.bodyTemperatureFeeling?.trim(),
      notes: dto.notes?.trim(),
    };
  }

  private mapSignal(signal: SymptomSignalDetails): SymptomResponseDto {
    return {
      id: signal.id,
      fatigueLevel: signal.fatigueLevel,
      sleepQuality: signal.sleepQuality,
      stiffness: signal.stiffness,
      mood: signal.mood,
      stress: signal.stress,
      cognitiveFog: signal.cognitiveFog,
      sensitivityLight: signal.sensitivityLight,
      sensitivityNoise: signal.sensitivityNoise,
      digestiveIssues: signal.digestiveIssues,
      headache: signal.headache,
      anxiety: signal.anxiety,
      depression: signal.depression,
      bodyTemperatureFeeling: signal.bodyTemperatureFeeling,
      notes: signal.notes,
      createdAt: signal.createdAt,
      updatedAt: signal.updatedAt,
    };
  }

  private mapAdminSignal(
    signal: AdminSymptomSignalDetails,
  ): AdminMappedSymptomSignal {
    return {
      id: signal.id,
      userId: signal.userId,
      dailyRecordId: signal.dailyRecordId,
      fatigueLevel: signal.fatigueLevel,
      sleepQuality: signal.sleepQuality,
      stiffness: signal.stiffness,
      mood: signal.mood,
      stress: signal.stress,
      cognitiveFog: signal.cognitiveFog,
      sensitivityLight: signal.sensitivityLight,
      sensitivityNoise: signal.sensitivityNoise,
      digestiveIssues: signal.digestiveIssues,
      headache: signal.headache,
      anxiety: signal.anxiety,
      depression: signal.depression,
      bodyTemperatureFeeling: signal.bodyTemperatureFeeling,
      notes: signal.notes,
      createdAt: signal.createdAt,
      updatedAt: signal.updatedAt,
      user: {
        id: signal.user.id,
        fullName: signal.user.fullName,
        email: signal.user.email,
      },
    };
  }
}
