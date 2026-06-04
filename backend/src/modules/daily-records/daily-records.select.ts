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
  batteryLevel: true,
  moodLevel: true,
  stressLevel: true,
  exerciseMinutes: true,
  medicationAdherence: true,
  waterIntakeLiters: true,
  weatherFeeling: true,
  derivedSignals: true,
  metadata: true,
  notes: true,
  symptomSignals: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
    select: {
      id: true,
      dailyRecordId: true,
      fatigueLevel: true,
      sleepQuality: true,
      stiffness: true,
      mood: true,
      stress: true,
      cognitiveFog: true,
      cognitiveFogLevel: true,
      sensitivityLight: true,
      sensitivityLightLevel: true,
      sensitivityNoise: true,
      sensitivityNoiseLevel: true,
      digestiveIssues: true,
      digestiveIssuesLevel: true,
      headache: true,
      headacheLevel: true,
      anxiety: true,
      anxietyLevel: true,
      depression: true,
      depressionLevel: true,
      bodyTemperatureFeeling: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  symptomEntries: {
    select: {
      id: true,
      symptomId: true,
      severity: true,
      durationMinutes: true,
      notes: true,
      symptom: {
        select: {
          name: true,
        },
      },
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DailyRecordSelect;

export type DailyRecordDetails = Prisma.DailyRecordGetPayload<{
  select: typeof dailyRecordResponseSelect;
}>;
