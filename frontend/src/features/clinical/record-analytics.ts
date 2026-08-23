import type { DailyRecord } from "@/services/daily-record.service";

export type DashboardRangeDays = 7 | 30 | 90;

export type DailyAggregate = {
  date: string;
  painAverage: number;
  painPeak: number;
  stressAverage: number;
  fatigueAverage: number;
  moodAverage: number;
  sleepHoursAverage: number | null;
  sleepQualityAverage: number | null;
  hydrationAverage: number | null;
  reliabilityAverage: number | null;
  symptomLoadAverage: number | null;
  recordCount: number;
  areas: string[];
  triggers: string[];
  painTypes: string[];
  latestRecord: DailyRecord;
};

export type FrequencyItem = {
  label: string;
  count: number;
  percentage: number;
};

function round(value: number, digits = 1): number {
  return Number(value.toFixed(digits));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function averageNullable(values: Array<number | null | undefined>): number | null {
  const normalized = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );

  if (normalized.length === 0) {
    return null;
  }

  return round(normalized.reduce((sum, value) => sum + value, 0) / normalized.length);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function normalizeDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
    .toISOString()
    .slice(0, 10);
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function formatShortDateLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(parseDateKey(value));
}

export function formatLongDateLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(parseDateKey(value));
}

export function buildTimelineSeries<T extends Record<string, unknown>>(
  dateFrom: string,
  dateTo: string,
  mapPoint: (dateKey: string, index: number) => T,
): Array<T & { date: string; label: string; tooltipLabel: string }> {
  const points: Array<T & { date: string; label: string; tooltipLabel: string }> = [];
  const startDate = parseDateKey(dateFrom);
  const endDate = parseDateKey(dateTo);

  for (
    let current = new Date(startDate), index = 0;
    current <= endDate;
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1),
      index += 1
  ) {
    const dateKey = normalizeDateKey(current);

    points.push({
      date: dateKey,
      label: formatShortDateLabel(dateKey),
      tooltipLabel: formatLongDateLabel(dateKey),
      ...mapPoint(dateKey, index),
    });
  }

  return points;
}

export function resolveDateWindow(days: DashboardRangeDays): {
  dateFrom: string;
  dateTo: string;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateFrom = new Date(today);
  dateFrom.setDate(today.getDate() - (days - 1));

  return {
    dateFrom: normalizeDateKey(dateFrom),
    dateTo: normalizeDateKey(today),
  };
}

export function buildFrequency(values: string[]): FrequencyItem[] {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });

  const maxCount = Math.max(...counts.values(), 1);

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / maxCount) * 100),
    }))
    .sort(
      (left, right) =>
        right.count - left.count || left.label.localeCompare(right.label),
    );
}

export function calculateSymptomLoad(record: DailyRecord): number | null {
  const signal = record.symptomSignal;

  const levels = signal
    ? [
        signal.stiffness,
        signal.cognitiveFogLevel,
        signal.headacheLevel,
        signal.digestiveIssuesLevel,
        signal.anxietyLevel,
        signal.depressionLevel,
        signal.sensitivityLightLevel,
        signal.sensitivityNoiseLevel,
      ]
    : record.symptomEntries.map((entry) => entry.severity);

  const normalized = levels.filter(
    (value): value is number => typeof value === "number" && value > 0,
  );

  if (normalized.length === 0) {
    return null;
  }

  return round(
    normalized.reduce((sum, value) => sum + value, 0) / normalized.length,
  );
}

export function buildDailyAggregates(records: DailyRecord[]): DailyAggregate[] {
  const dayMap = new Map<string, DailyRecord[]>();

  records.forEach((record) => {
    const key = normalizeDateKey(record.recordDate);
    const bucket = dayMap.get(key);

    if (bucket) {
      bucket.push(record);
      return;
    }

    dayMap.set(key, [record]);
  });

  return [...dayMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dayRecords]) => {
      const ordered = [...dayRecords].sort((left, right) =>
        left.createdAt.localeCompare(right.createdAt),
      );
      const latestRecord = ordered.at(-1) ?? ordered[0]!;

      return {
        date,
        painAverage: average(ordered.map((record) => record.painLevel)),
        painPeak: Math.max(...ordered.map((record) => record.painLevel)),
        stressAverage: average(ordered.map((record) => record.stressLevel)),
        fatigueAverage: average(ordered.map((record) => record.fatigueLevel)),
        moodAverage: average(
          ordered.map((record) => record.moodLevel ?? record.mood),
        ),
        sleepHoursAverage: averageNullable(
          ordered.map((record) => record.sleepHours),
        ),
        sleepQualityAverage: averageNullable(
          ordered.map((record) => record.sleepQuality),
        ),
        hydrationAverage: averageNullable(
          ordered.map((record) => record.hydration),
        ),
        reliabilityAverage: averageNullable(
          ordered.map((record) => record.dataReliabilityScore),
        ),
        symptomLoadAverage: averageNullable(
          ordered.map((record) => calculateSymptomLoad(record)),
        ),
        recordCount: ordered.length,
        areas: unique(ordered.flatMap((record) => record.painAreas)),
        triggers: unique(ordered.flatMap((record) => record.painTriggers)),
        painTypes: unique(
          ordered
            .map((record) => record.painType)
            .filter((value): value is string => Boolean(value)),
        ),
        latestRecord,
      };
    });
}
