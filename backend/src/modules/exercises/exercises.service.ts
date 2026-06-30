import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import type { CreateExerciseHistoryDto } from './dto/create-exercise-history.dto';
import type { ExerciseHistoryListResponseDto, ExerciseHistoryResponseDto } from './dto/exercise-history-response.dto';
import type { ExerciseListResponseDto, ExerciseResponseDto } from './dto/exercise-response.dto';
import type { ExerciseStatsResponseDto } from './dto/exercise-stats-response.dto';
import type { ExerciseQueryDto } from './dto/exercise-query.dto';
import {
  exerciseHistoryResponseSelect,
  exerciseResponseSelect,
  type ExerciseDetails,
  type ExerciseHistoryDetails,
} from './exercises.select';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Exercícios (catálogo) ────────────────────────────────────────────────

  async listExercises(query: ExerciseQueryDto): Promise<ExerciseListResponseDto> {
    const where: Prisma.ExerciseWhereInput = {
      isActive: true,
      ...(query.category ? { category: query.category } : {}),
      ...(query.difficulty ? { difficulty: query.difficulty } : {}),
    };

    const items = await this.prisma.exercise.findMany({
      where,
      select: exerciseResponseSelect,
      orderBy: { title: 'asc' },
    });

    return { items: items.map((item) => this.mapExercise(item)) };
  }

  async findExerciseById(id: string): Promise<ExerciseResponseDto> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      select: exerciseResponseSelect,
    });

    if (!exercise) {
      throw new NotFoundException('Exercício não encontrado.');
    }

    return this.mapExercise(exercise);
  }

  // ─── Histórico do usuário ─────────────────────────────────────────────────

  async createHistory(
    userId: string,
    dto: CreateExerciseHistoryDto,
  ): Promise<ExerciseHistoryResponseDto> {
    // Verifica se o exercício existe e está ativo
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: dto.exerciseId },
      select: { id: true, isActive: true },
    });

    if (!exercise || !exercise.isActive) {
      throw new NotFoundException('Exercício não encontrado ou inativo.');
    }

    // Regra de negócio: apenas um registro por exercício por dia
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const alreadyDoneToday = await this.prisma.exerciseHistory.findFirst({
      where: {
        userId,
        exerciseId: dto.exerciseId,
        completedAt: { gte: startOfToday, lte: endOfToday },
      },
      select: { id: true },
    });

    if (alreadyDoneToday) {
      throw new BadRequestException('Você já concluiu este exercício hoje.');
    }

    const history = await this.prisma.exerciseHistory.create({
      data: {
        userId,
        exerciseId: dto.exerciseId,
        durationPerformed: dto.durationPerformed ?? null,
        difficultyReported: dto.difficultyReported ?? null,
        notes: dto.notes?.trim() ?? null,
      },
      select: exerciseHistoryResponseSelect,
    });

    return this.mapHistory(history);
  }

  async listHistory(userId: string): Promise<ExerciseHistoryListResponseDto> {
    const items = await this.prisma.exerciseHistory.findMany({
      where: { userId },
      select: exerciseHistoryResponseSelect,
      orderBy: { completedAt: 'desc' },
    });

    return { items: items.map((item) => this.mapHistory(item)) };
  }

  // ─── Estatísticas ─────────────────────────────────────────────────────────

  async getStats(userId: string): Promise<ExerciseStatsResponseDto> {
    const allHistory = await this.prisma.exerciseHistory.findMany({
      where: { userId },
      select: {
        completedAt: true,
        durationPerformed: true,
        exercise: { select: { durationMinutes: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    const totalCompleted = allHistory.length;

    // Tempo total = duração real se informada, senão duração estimada do exercício
    const totalMinutes = allHistory.reduce((sum, h) => {
      return sum + (h.durationPerformed ?? h.exercise.durationMinutes);
    }, 0);

    // Exercícios nos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyCount = allHistory.filter(
      (h) => new Date(h.completedAt) >= sevenDaysAgo,
    ).length;

    // Sequência atual: conta dias consecutivos com ao menos 1 exercício
    const currentStreak = this.calculateStreak(allHistory.map((h) => h.completedAt));

    return { totalCompleted, currentStreak, weeklyCount, totalMinutes };
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;

    // Extrai datas únicas no formato YYYY-MM-DD e ordena decrescente
    const uniqueDays = Array.from(
      new Set(dates.map((d) => new Date(d).toISOString().split('T')[0])),
    ).sort((a, b) => (a > b ? -1 : 1));

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Sequência só conta se o usuário exercitou hoje ou ontem
    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private mapExercise(exercise: ExerciseDetails): ExerciseResponseDto {
    return {
      id: exercise.id,
      title: exercise.title,
      description: exercise.description,
      imageUrl: exercise.imageUrl,
      category: exercise.category,
      difficulty: exercise.difficulty,
      durationMinutes: exercise.durationMinutes,
      instructions: exercise.instructions,
      benefits: exercise.benefits,
      precautions: exercise.precautions,
      isActive: exercise.isActive,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
    };
  }

  private mapHistory(history: ExerciseHistoryDetails): ExerciseHistoryResponseDto {
    return {
      id: history.id,
      completedAt: history.completedAt,
      durationPerformed: history.durationPerformed,
      difficultyReported: history.difficultyReported,
      notes: history.notes,
      createdAt: history.createdAt,
      exercise: {
        id: history.exercise.id,
        title: history.exercise.title,
        category: history.exercise.category,
        durationMinutes: history.exercise.durationMinutes,
        imageUrl: history.exercise.imageUrl,
      },
    };
  }
}
