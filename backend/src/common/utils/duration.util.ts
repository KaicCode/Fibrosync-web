const DURATION_MULTIPLIERS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseDurationToMilliseconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());

  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }

  const amount = match[1];
  const unit = match[2] as keyof typeof DURATION_MULTIPLIERS;
  const multiplier = DURATION_MULTIPLIERS[unit];

  if (!multiplier) {
    throw new Error(`Unsupported duration unit: ${unit}`);
  }

  return Number(amount) * multiplier;
}

export function addDuration(baseDate: Date, duration: string): Date {
  return new Date(baseDate.getTime() + parseDurationToMilliseconds(duration));
}
