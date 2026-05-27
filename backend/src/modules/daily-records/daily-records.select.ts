import type { Prisma } from '@prisma/client';

export const dailyRecordResponseSelect = {
  id: true,
  recordDate: true,
  painLevel: true,
  painType: true,
  painAreas: true,
  painTriggers: true,
  sleepHours: true,
  sleepQuality: true,
  fatigueLevel: true,
  moodLevel: true,
  stressLevel: true,
  exerciseMinutes: true,
  medicationAdherence: true,
  waterIntakeLiters: true,
  weatherFeeling: true,
  metadata: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DailyRecordSelect;

export type DailyRecordDetails = Prisma.DailyRecordGetPayload<{
  select: typeof dailyRecordResponseSelect;
}>;
