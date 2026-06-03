import { SymptomCategory } from '@prisma/client';

export const symptomCatalogDefinitions = [
  {
    key: 'cognitiveFog',
    levelKey: 'cognitiveFogLevel',
    label: 'Fibro fog',
    category: SymptomCategory.COGNITIVE,
  },
  {
    key: 'headache',
    levelKey: 'headacheLevel',
    label: 'Cefaleia',
    category: SymptomCategory.OTHER,
  },
  {
    key: 'digestiveIssues',
    levelKey: 'digestiveIssuesLevel',
    label: 'Alteracoes digestivas',
    category: SymptomCategory.DIGESTIVE,
  },
  {
    key: 'anxiety',
    levelKey: 'anxietyLevel',
    label: 'Ansiedade',
    category: SymptomCategory.MOOD,
  },
  {
    key: 'depression',
    levelKey: 'depressionLevel',
    label: 'Humor depressivo',
    category: SymptomCategory.MOOD,
  },
  {
    key: 'sensitivityLight',
    levelKey: 'sensitivityLightLevel',
    label: 'Sensibilidade a luz',
    category: SymptomCategory.OTHER,
  },
  {
    key: 'sensitivityNoise',
    levelKey: 'sensitivityNoiseLevel',
    label: 'Sensibilidade a ruido',
    category: SymptomCategory.OTHER,
  },
  {
    key: 'stiffness',
    levelKey: 'stiffness',
    label: 'Rigidez corporal',
    category: SymptomCategory.MOBILITY,
  },
] as const;

export type SymptomCatalogKey =
  (typeof symptomCatalogDefinitions)[number]['key'];
export type SymptomLevelKey =
  (typeof symptomCatalogDefinitions)[number]['levelKey'];

export type SymptomSignalInput = {
  stiffness?: number | null;
  cognitiveFog?: boolean;
  cognitiveFogLevel?: number | null;
  sensitivityLight?: boolean;
  sensitivityLightLevel?: number | null;
  sensitivityNoise?: boolean;
  sensitivityNoiseLevel?: number | null;
  digestiveIssues?: boolean;
  digestiveIssuesLevel?: number | null;
  headache?: boolean;
  headacheLevel?: number | null;
  anxiety?: boolean;
  anxietyLevel?: number | null;
  depression?: boolean;
  depressionLevel?: number | null;
};

function clampLevel(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), 10);
}

export function resolveSymptomLevel(
  levelValue?: number | null,
  flagValue?: boolean | null,
): number | null {
  if (typeof levelValue === 'number' && Number.isFinite(levelValue)) {
    const clamped = clampLevel(levelValue);
    return clamped > 0 ? clamped : null;
  }

  if (flagValue) {
    return 5;
  }

  return null;
}

export function resolveSymptomFlag(
  levelValue?: number | null,
  flagValue?: boolean | null,
): boolean {
  return resolveSymptomLevel(levelValue, flagValue) !== null;
}

export function buildSymptomSignalLevels(
  input: SymptomSignalInput,
): Record<SymptomCatalogKey | 'stiffness', number | null> {
  return {
    stiffness:
      typeof input.stiffness === 'number' && Number.isFinite(input.stiffness)
        ? clampLevel(input.stiffness)
        : null,
    cognitiveFog: resolveSymptomLevel(
      input.cognitiveFogLevel,
      input.cognitiveFog,
    ),
    sensitivityLight: resolveSymptomLevel(
      input.sensitivityLightLevel,
      input.sensitivityLight,
    ),
    sensitivityNoise: resolveSymptomLevel(
      input.sensitivityNoiseLevel,
      input.sensitivityNoise,
    ),
    digestiveIssues: resolveSymptomLevel(
      input.digestiveIssuesLevel,
      input.digestiveIssues,
    ),
    headache: resolveSymptomLevel(input.headacheLevel, input.headache),
    anxiety: resolveSymptomLevel(input.anxietyLevel, input.anxiety),
    depression: resolveSymptomLevel(input.depressionLevel, input.depression),
  };
}

export function averageSymptomBurden(
  levels: Array<number | null | undefined>,
): number {
  const normalizedLevels = levels.filter(
    (value): value is number => typeof value === 'number' && value > 0,
  );

  if (normalizedLevels.length === 0) {
    return 0;
  }

  return (
    normalizedLevels.reduce((sum, value) => sum + value, 0) /
    normalizedLevels.length
  );
}
