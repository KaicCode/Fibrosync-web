import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { addDays, normalizeDateOnly } from '@/common/utils/date.util';
import {
  buildPaginationMeta,
  resolvePagination,
} from '@/common/utils/pagination.util';
import { PrismaService } from '@/database/prisma.service';
import type { CreateSymptomDto } from './dto/create-symptom.dto';
import type { SymptomListResponseDto } from './dto/symptom-list-response.dto';
import type { SymptomResponseDto } from './dto/symptom-response.dto';
import type { SymptomQueryDto } from './dto/symptom-query.dto';
import type { UpdateSymptomDto } from './dto/update-symptom.dto';
import {
  type SymptomSignalDetails,
  symptomSignalResponseSelect,
} from './symptoms.select';

@Injectable()
export class SymptomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateSymptomDto,
  ): Promise<SymptomResponseDto> {
    const signal = await this.prisma.symptomSignal.create({
      data: {
        userId,
        fatigueLevel: dto.fatigueLevel,
        sleepQuality: dto.sleepQuality,
        stiffness: dto.stiffness,
        mood: dto.mood,
        stress: dto.stress,
        cognitiveFog: dto.cognitiveFog ?? false,
        sensitivityLight: dto.sensitivityLight ?? false,
        sensitivityNoise: dto.sensitivityNoise ?? false,
        digestiveIssues: dto.digestiveIssues ?? false,
        headache: dto.headache ?? false,
        anxiety: dto.anxiety ?? false,
        depression: dto.depression ?? false,
        bodyTemperatureFeeling: dto.bodyTemperatureFeeling?.trim(),
        notes: dto.notes?.trim(),
      },
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
      data: {
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
      },
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
}
