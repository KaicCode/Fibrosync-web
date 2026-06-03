interface DataReliabilityInput {
  recordDate: Date | string;
  createdAt?: Date | string | null;
  painLevel?: number | null;
  fatigueLevel?: number | null;
  stressLevel?: number | null;
  moodLevel?: number | null;
  sleepQuality?: number | null;
  sleepHours?: number | null;
  hydration?: number | null;
  physicalActivity?: number | null;
  medicationTaken?: boolean | null;
  weatherFeeling?: string | null;
  notes?: string | null;
  painType?: string | null;
  painAreas?: string[] | null;
  painTriggers?: string[] | null;
  symptomSignalPresent?: boolean;
  symptomEntryCount?: number;
  derivedSignals?: boolean | null;
}

export interface DataReliabilitySnapshot {
  score: number;
  label:
    | 'Baixa confiabilidade'
    | 'Confiabilidade moderada'
    | 'Alta confiabilidade';
}

function hasNumber(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasList(values: string[] | null | undefined): boolean {
  return (
    Array.isArray(values) && values.some((value) => value.trim().length > 0)
  );
}

function temporalConsistencyScore(
  recordDate: Date | string,
  createdAt?: Date | string | null,
): number {
  if (!createdAt) {
    return 0;
  }

  const recordReference = new Date(recordDate);
  const creationReference = new Date(createdAt);

  if (
    Number.isNaN(recordReference.getTime()) ||
    Number.isNaN(creationReference.getTime())
  ) {
    return 0;
  }

  const differenceMs = Math.abs(
    creationReference.getTime() - recordReference.getTime(),
  );
  const differenceDays = differenceMs / (1000 * 60 * 60 * 24);

  if (differenceDays <= 1.1) {
    return 8;
  }

  if (differenceDays <= 3.1) {
    return 4;
  }

  return 0;
}

export function calculateDataReliability(
  input: DataReliabilityInput,
): DataReliabilitySnapshot {
  let score = 0;

  score += hasNumber(input.painLevel) ? 9 : 0;
  score += hasNumber(input.fatigueLevel) ? 9 : 0;
  score += hasNumber(input.stressLevel) ? 9 : 0;
  score += hasNumber(input.moodLevel) ? 9 : 0;
  score += hasNumber(input.sleepQuality) ? 8 : 0;
  score += hasNumber(input.sleepHours) ? 12 : 0;

  score += hasNumber(input.hydration) ? 6 : 0;
  score += hasNumber(input.physicalActivity) ? 5 : 0;
  score +=
    input.medicationTaken !== null && input.medicationTaken !== undefined
      ? 4
      : 0;
  score += hasText(input.weatherFeeling) ? 4 : 0;
  score += hasText(input.painType) ? 4 : 0;
  score += hasList(input.painAreas) ? 6 : 0;
  score += hasList(input.painTriggers) ? 4 : 0;
  score += hasText(input.notes) ? 4 : 0;

  if (input.symptomSignalPresent || (input.symptomEntryCount ?? 0) > 0) {
    score += 12;
  }

  score += temporalConsistencyScore(input.recordDate, input.createdAt);

  if (input.derivedSignals) {
    score -= 18;
  }

  const normalizedScore = Math.min(Math.max(Math.round(score), 0), 100);

  if (normalizedScore <= 40) {
    return {
      score: normalizedScore,
      label: 'Baixa confiabilidade',
    };
  }

  if (normalizedScore <= 70) {
    return {
      score: normalizedScore,
      label: 'Confiabilidade moderada',
    };
  }

  return {
    score: normalizedScore,
    label: 'Alta confiabilidade',
  };
}
