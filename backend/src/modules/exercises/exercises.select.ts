import { Prisma } from '@prisma/client';

// Select tipado para o exercício completo (retornado em listagem e detalhe)
export const exerciseResponseSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  category: true,
  difficulty: true,
  durationMinutes: true,
  instructions: true,
  benefits: true,
  precautions: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ExerciseSelect;

// Select tipado para o histórico de exercícios
export const exerciseHistoryResponseSelect = {
  id: true,
  completedAt: true,
  durationPerformed: true,
  difficultyReported: true,
  notes: true,
  createdAt: true,
  exercise: {
    select: {
      id: true,
      title: true,
      category: true,
      durationMinutes: true,
      imageUrl: true,
    },
  },
} satisfies Prisma.ExerciseHistorySelect;

// Tipos inferidos do Prisma para usar nas funções de mapeamento
export type ExerciseDetails = Prisma.ExerciseGetPayload<{
  select: typeof exerciseResponseSelect;
}>;

export type ExerciseHistoryDetails = Prisma.ExerciseHistoryGetPayload<{
  select: typeof exerciseHistoryResponseSelect;
}>;
