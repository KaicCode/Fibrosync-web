import type { Prisma } from '@prisma/client';

export const symptomSignalResponseSelect = {
  id: true,
  userId: true,
  dailyRecordId: true,
  fatigueLevel: true,
  sleepQuality: true,
  stiffness: true,
  mood: true,
  stress: true,
  cognitiveFog: true,
  sensitivityLight: true,
  sensitivityNoise: true,
  digestiveIssues: true,
  headache: true,
  anxiety: true,
  depression: true,
  bodyTemperatureFeeling: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SymptomSignalSelect;

export type SymptomSignalDetails = Prisma.SymptomSignalGetPayload<{
  select: typeof symptomSignalResponseSelect;
}>;

export const adminSymptomSignalResponseSelect = {
  id: true,
  userId: true,
  dailyRecordId: true,
  fatigueLevel: true,
  sleepQuality: true,
  stiffness: true,
  mood: true,
  stress: true,
  cognitiveFog: true,
  sensitivityLight: true,
  sensitivityNoise: true,
  digestiveIssues: true,
  headache: true,
  anxiety: true,
  depression: true,
  bodyTemperatureFeeling: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} satisfies Prisma.SymptomSignalSelect;

export type AdminSymptomSignalDetails = Prisma.SymptomSignalGetPayload<{
  select: typeof adminSymptomSignalResponseSelect;
}>;
