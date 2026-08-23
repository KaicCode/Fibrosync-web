export const FALLBACK_NOTIFICATION_TIMEZONE = "America/Sao_Paulo";

function getFormatterParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  return formatter.formatToParts(date);
}

function getPartValue(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function getDateKeyInTimeZone(date: Date, timeZone: string): string {
  try {
    const parts = getFormatterParts(date, timeZone);
    const year = getPartValue(parts, "year");
    const month = getPartValue(parts, "month");
    const day = getPartValue(parts, "day");

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fallback handled below.
  }

  const fallback = new Date(date);
  const year = fallback.getFullYear();
  const month = String(fallback.getMonth() + 1).padStart(2, "0");
  const day = String(fallback.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getMinutesInTimeZone(date: Date, timeZone: string): number {
  try {
    const parts = getFormatterParts(date, timeZone);
    const hour = Number(getPartValue(parts, "hour"));
    const minute = Number(getPartValue(parts, "minute"));

    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      return hour * 60 + minute;
    }
  } catch {
    // Fallback handled below.
  }

  return date.getHours() * 60 + date.getMinutes();
}

export function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

export function hasReachedTime(timeValue: string, now: Date, timeZone: string): boolean {
  const targetMinutes = parseTimeToMinutes(timeValue);

  if (targetMinutes === null) {
    return false;
  }

  return getMinutesInTimeZone(now, timeZone) >= targetMinutes;
}

export function isQuietHoursRangeValid(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): boolean {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  return startMinutes !== null && endMinutes !== null && startMinutes !== endMinutes;
}

export function isTimeWithinQuietHoursRange(
  currentMinutes: number,
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): boolean {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (
    startMinutes === null ||
    endMinutes === null ||
    startMinutes === endMinutes
  ) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function isInQuietHours(input: {
  now: Date;
  timeZone: string;
  quietHoursEnabled: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}): boolean {
  if (!input.quietHoursEnabled) {
    return false;
  }

  const currentMinutes = getMinutesInTimeZone(input.now, input.timeZone);

  return isTimeWithinQuietHoursRange(
    currentMinutes,
    input.quietHoursStart,
    input.quietHoursEnd,
  );
}
