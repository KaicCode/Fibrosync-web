import { apiCall } from '@/lib/api-client';

// ─── Enums (espelham os do Prisma) ────────────────────────────────────────

export type ExerciseCategory =
  | 'STRETCHING'
  | 'MOBILITY'
  | 'STRENGTHENING'
  | 'BREATHING'
  | 'RELAXATION'
  | 'WALKING';

export type ExerciseDifficulty =
  | 'VERY_EASY'
  | 'EASY'
  | 'MODERATE'
  | 'HARD'
  | 'VERY_HARD';

// Avaliação de dificuldade percebida pelo usuário após concluir
export type DifficultyReported =
  | 'VERY_EASY'
  | 'EASY'
  | 'NORMAL'
  | 'HARD'
  | 'VERY_HARD';

// ─── Tipos de domínio ──────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  durationMinutes: number;
  instructions: string[];
  benefits: string[];
  precautions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseHistoryItem {
  id: string;
  completedAt: string;
  durationPerformed: number | null;
  difficultyReported: string | null;
  notes: string | null;
  createdAt: string;
  exercise: {
    id: string;
    title: string;
    category: ExerciseCategory;
    durationMinutes: number;
    imageUrl: string | null;
  };
}

// Estatísticas calculadas pelo backend
export interface ExerciseStats {
  totalCompleted: number;
  currentStreak: number;
  weeklyCount: number;
  totalMinutes: number;
}

// ─── DTOs de envio ────────────────────────────────────────────────────────

export interface CreateExerciseHistoryDto {
  exerciseId: string;
  durationPerformed?: number;
  difficultyReported?: DifficultyReported;
  notes?: string;
}

export interface ExerciseFilters {
  category?: ExerciseCategory;
  difficulty?: ExerciseDifficulty;
}

// ─── Service ──────────────────────────────────────────────────────────────

export const exerciseService = {
  // Lista todos os exercícios ativos (com filtros opcionais)
  listExercises: async (filters?: ExerciseFilters): Promise<Exercise[]> => {
    const response = await apiCall<{ items: Exercise[] }>(
      'get',
      '/exercises',
      undefined,
      { params: filters },
    );
    return response.items;
  },

  // Busca um exercício completo pelo id (inclui passo a passo)
  getExerciseById: async (id: string): Promise<Exercise> => {
    return await apiCall<Exercise>('get', `/exercises/${id}`);
  },

  // Estatísticas de progresso do usuário autenticado
  getStats: async (): Promise<ExerciseStats> => {
    return await apiCall<ExerciseStats>('get', '/exercises/stats');
  },

  // Histórico completo do usuário
  listHistory: async (): Promise<ExerciseHistoryItem[]> => {
    const response = await apiCall<{ items: ExerciseHistoryItem[] }>(
      'get',
      '/exercises/history/me',
    );
    return response.items;
  },

  // Registra um exercício concluído
  completeExercise: async (
    dto: CreateExerciseHistoryDto,
  ): Promise<ExerciseHistoryItem> => {
    return await apiCall<ExerciseHistoryItem>('post', '/exercises/history', dto);
  },
};

// ─── Helpers de label ──────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<ExerciseCategory | 'all', string> = {
  all: 'Todos',
  STRETCHING: 'Alongamentos',
  MOBILITY: 'Mobilidade',
  STRENGTHENING: 'Fortalecimento',
  BREATHING: 'Respiração',
  RELAXATION: 'Relaxamento',
  WALKING: 'Caminhada',
};

export const DIFFICULTY_LABELS: Record<ExerciseDifficulty, string> = {
  VERY_EASY: 'Muito fácil',
  EASY: 'Fácil',
  MODERATE: 'Moderado',
  HARD: 'Difícil',
  VERY_HARD: 'Muito difícil',
};

export const DIFFICULTY_REPORTED_LABELS: Record<DifficultyReported, string> = {
  VERY_EASY: 'Muito fácil',
  EASY: 'Fácil',
  NORMAL: 'Normal',
  HARD: 'Difícil',
  VERY_HARD: 'Muito difícil',
};
