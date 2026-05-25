import type { Prisma } from '@prisma/client';

export const reportResponseSelect = {
  id: true,
  type: true,
  status: true,
  periodStart: true,
  periodEnd: true,
  summary: true,
  fileUrl: true,
  generatedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReportSelect;

export type ReportDetails = Prisma.ReportGetPayload<{
  select: typeof reportResponseSelect;
}>;
