import { useEffect, useMemo, useRef, useState } from "react";
import { buildFrequency } from "@/features/clinical/record-analytics";
import { useDailyRecords } from "@/hooks/useDailyRecords";
import { useUserSettings } from "@/hooks/useUserSettings";
import {
  FALLBACK_NOTIFICATION_TIMEZONE,
  getDateKeyInTimeZone,
  hasReachedTime,
  isInQuietHours,
} from "@/lib/notification-preferences";
import type { DailyRecord } from "@/services/daily-record.service";
import type { UserProfile } from "@/services/user.service";

type DailySummaryCard = {
  title: string;
  message: string;
  description: string;
  actionLabel: string;
  actionTo: string;
};

type DailyReminderCard = {
  title: string;
  message: string;
  actionLabel: string;
  actionTo: string;
  secondaryLabel: string;
};

type ReminderStorageState = {
  dateKey: string;
  shownAt: string;
  snoozedUntil?: string | null;
};

type SummaryStorageState = {
  dateKey: string;
  shownAt: string;
};

const ROUTINE_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const ROUTINE_WINDOW_DAYS = 30;
const REMINDER_SNOOZE_MS = 60 * 60 * 1000;

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() + days);

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function extractRecordDateKey(recordDate: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(recordDate)) {
    return recordDate;
  }

  return getDateKeyInTimeZone(new Date(recordDate), FALLBACK_NOTIFICATION_TIMEZONE);
}

function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function getSummaryStorageKey(userId: string): string {
  return `fibrosync:routine:${userId}:daily-summary`;
}

function getReminderStorageKey(userId: string): string {
  return `fibrosync:routine:${userId}:daily-reminder`;
}

function formatCount(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatScore(value: number): string {
  const digits = value % 1 === 0 ? 0 : 1;

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: 1,
  });
}

function formatHoursLabel(value: number): string {
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  if (hours === 0) {
    return `${minutes}min`;
  }

  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageNullable(values: Array<number | null | undefined>): number | null {
  const normalized = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );

  if (normalized.length === 0) {
    return null;
  }

  return normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
}

function buildDailySummary(records: DailyRecord[]): DailySummaryCard {
  const dayMap = new Map<string, DailyRecord[]>();

  records.forEach((record) => {
    const bucket = dayMap.get(record.recordDate) ?? [];
    bucket.push(record);
    dayMap.set(record.recordDate, bucket);
  });

  const daySummaries = [...dayMap.values()].map((dayRecords) => ({
    painAverage: average(dayRecords.map((record) => record.painLevel)),
    fatigueAverage: average(dayRecords.map((record) => record.fatigueLevel)),
    stressAverage: average(dayRecords.map((record) => record.stressLevel)),
    sleepHoursAverage: averageNullable(
      dayRecords.map((record) => record.sleepHours),
    ),
  }));
  const trackedDays = daySummaries.length;

  if (trackedDays < 3) {
    return {
      title: "Seu resumo de hoje",
      message: "Voce ainda possui poucos registros para gerar um resumo completo.",
      description:
        "Continue registrando como voce esta se sentindo para acompanhar sua evolucao.",
      actionLabel: "Ver meus registros",
      actionTo: "/app/calendar",
    };
  }

  const averagePain =
    daySummaries.reduce((sum, day) => sum + day.painAverage, 0) / daySummaries.length;
  const sleepValues = daySummaries
    .map((day) => day.sleepHoursAverage)
    .filter((value): value is number => typeof value === "number");
  const averageSleep =
    sleepValues.length > 0
      ? sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length
      : null;
  const fatigueHighDays = daySummaries.filter((day) => day.fatigueAverage >= 6).length;
  const stressHighDays = daySummaries.filter((day) => day.stressAverage >= 6).length;
  const topTrigger = buildFrequency(
    records.flatMap((record) => record.painTriggers),
  )[0];

  const observations: string[] = [];

  if (averageSleep !== null) {
    observations.push(`Voce dormiu em media ${formatHoursLabel(averageSleep)}.`);
  }

  if (fatigueHighDays > 0) {
    observations.push(
      fatigueHighDays === 1
        ? "A fadiga apareceu mais alta em 1 dia."
        : "A fadiga apareceu mais alta em alguns dias.",
    );
  }

  if (stressHighDays > 0) {
    observations.push(
      stressHighDays === 1
        ? "O estresse apareceu mais alto em 1 dia."
        : "O estresse apareceu mais alto em alguns dias.",
    );
  }

  if (topTrigger) {
    observations.push(`O gatilho mais citado foi ${topTrigger.label}.`);
  }

  return {
    title: "Seu resumo de hoje",
    message: `Nos seus registros recentes, sua dor media foi ${formatScore(averagePain)}/10 e voce registrou ${formatCount(
      trackedDays,
      "dia",
      "dias",
    )} nos ultimos ${ROUTINE_WINDOW_DAYS} dias.`,
    description: `${observations.slice(0, 2).join(" ")} Continue registrando para acompanhar melhor sua evolucao.`
      .trim(),
    actionLabel: "Ver meus registros",
    actionTo: "/app/calendar",
  };
}

export function useDailyRoutine(user: UserProfile | null | undefined) {
  const { settings, isLoading: isLoadingSettings } = useUserSettings();
  const [now, setNow] = useState(() => new Date());
  const [storageVersion, setStorageVersion] = useState(0);
  const [dismissedSummaryDateKey, setDismissedSummaryDateKey] = useState<string | null>(null);
  const summaryPersistRef = useRef<string | null>(null);
  const reminderPersistRef = useRef<string | null>(null);

  const timeZone = user?.timezone || FALLBACK_NOTIFICATION_TIMEZONE;
  const todayDateKey = useMemo(
    () => getDateKeyInTimeZone(now, timeZone),
    [now, timeZone],
  );
  const routineWindow = useMemo(
    () => ({
      dateFrom: shiftDateKey(todayDateKey, -(ROUTINE_WINDOW_DAYS - 1)),
      dateTo: todayDateKey,
    }),
    [todayDateKey],
  );
  const { records, isLoading: isLoadingRecords } = useDailyRecords({
    includeAll: true,
    dateFrom: routineWindow.dateFrom,
    dateTo: routineWindow.dateTo,
  });

  const normalizedRecords = useMemo<DailyRecord[]>(
    () =>
      records
        .map((record) => ({
          ...record,
          recordDate: extractRecordDateKey(record.recordDate),
        }))
        .sort((left, right) => left.recordDate.localeCompare(right.recordDate)),
    [records],
  );

  const hasRecordToday = useMemo(
    () => normalizedRecords.some((record) => record.recordDate === todayDateKey),
    [normalizedRecords, todayDateKey],
  );
  const summaryCard = useMemo(
    () => buildDailySummary(normalizedRecords),
    [normalizedRecords],
  );
  const reminderCard = useMemo<DailyReminderCard>(
    () => ({
      title: "Como voce se sentiu hoje?",
      message: "Voce ainda nao registrou como se sentiu hoje.",
      actionLabel: "Fazer registro",
      actionTo: `/app/pain-log?date=${todayDateKey}`,
      secondaryLabel: "Lembrar depois",
    }),
    [todayDateKey],
  );

  const isLoading = isLoadingSettings || isLoadingRecords;
  const summaryStorageState = useMemo(
    () => {
      void storageVersion;

      return user?.id
        ? readStorage<SummaryStorageState>(getSummaryStorageKey(user.id))
        : null;
    },
    [storageVersion, user?.id],
  );
  const reminderStorageState = useMemo(
    () => {
      void storageVersion;

      return user?.id
        ? readStorage<ReminderStorageState>(getReminderStorageKey(user.id))
        : null;
    },
    [storageVersion, user?.id],
  );
  const hasSummaryShownToday = summaryStorageState?.dateKey === todayDateKey;
  const reminderShownToday = reminderStorageState?.dateKey === todayDateKey;
  const reminderSnoozedUntil = reminderStorageState?.snoozedUntil
    ? new Date(reminderStorageState.snoozedUntil)
    : null;
  const reminderSnoozeActive =
    reminderShownToday &&
    reminderSnoozedUntil !== null &&
    reminderSnoozedUntil.getTime() > now.getTime();
  const reminderSnoozeExpired =
    reminderShownToday &&
    reminderSnoozedUntil !== null &&
    reminderSnoozedUntil.getTime() <= now.getTime();
  const inQuietHours = isInQuietHours({
    now,
    timeZone,
    quietHoursEnabled: Boolean(settings?.quietHoursEnabled),
    quietHoursStart: settings?.quietHoursStart,
    quietHoursEnd: settings?.quietHoursEnd,
  });
  const shouldShowSummary =
    !isLoading &&
    Boolean(settings?.dailySummaryEnabled) &&
    Boolean(settings?.inAppNotificationsEnabled) &&
    hasReachedTime(settings?.dailySummaryTime ?? "", now, timeZone) &&
    !inQuietHours &&
    !hasSummaryShownToday &&
    dismissedSummaryDateKey !== todayDateKey;
  const shouldShowReminder =
    !isLoading &&
    Boolean(settings?.endOfDayReminderEnabled) &&
    Boolean(settings?.inAppNotificationsEnabled) &&
    hasReachedTime(settings?.endOfDayReminderTime ?? "", now, timeZone) &&
    !inQuietHours &&
    !hasRecordToday &&
    !reminderSnoozeActive &&
    (!reminderShownToday || reminderSnoozeExpired);
  const dailySummary = shouldShowSummary ? summaryCard : null;
  const dailyReminder = shouldShowReminder ? reminderCard : null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, ROUTINE_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!dailySummary || !user?.id) {
      return;
    }

    const persistKey = `${todayDateKey}:${summaryStorageState?.shownAt ?? "fresh"}`;

    if (summaryPersistRef.current === persistKey) {
      return;
    }

    summaryPersistRef.current = persistKey;
    writeStorage(getSummaryStorageKey(user.id), {
      dateKey: todayDateKey,
      shownAt: new Date().toISOString(),
    } satisfies SummaryStorageState);
  }, [dailySummary, summaryStorageState?.shownAt, todayDateKey, user?.id]);

  useEffect(() => {
    if (!dailyReminder || !user?.id) {
      return;
    }

    const persistKey = `${todayDateKey}:${reminderStorageState?.snoozedUntil ?? "fresh"}`;

    if (reminderPersistRef.current === persistKey) {
      return;
    }

    reminderPersistRef.current = persistKey;
    writeStorage(getReminderStorageKey(user.id), {
      dateKey: todayDateKey,
      shownAt: new Date().toISOString(),
      snoozedUntil: null,
    } satisfies ReminderStorageState);
  }, [dailyReminder, reminderStorageState?.snoozedUntil, todayDateKey, user?.id]);

  function dismissDailySummary() {
    setDismissedSummaryDateKey(todayDateKey);
  }

  function snoozeDailyReminder() {
    if (!user?.id) {
      return;
    }

    writeStorage(getReminderStorageKey(user.id), {
      dateKey: todayDateKey,
      shownAt: new Date().toISOString(),
      snoozedUntil: new Date(Date.now() + REMINDER_SNOOZE_MS).toISOString(),
    } satisfies ReminderStorageState);
    setStorageVersion((current) => current + 1);
  }

  return {
    settings,
    isLoading,
    dailySummary,
    dailyReminder,
    dismissDailySummary,
    snoozeDailyReminder,
  };
}
