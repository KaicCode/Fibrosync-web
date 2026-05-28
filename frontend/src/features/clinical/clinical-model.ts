export type BodyAreaSide = "front" | "back";

export type BodyAreaDefinition = {
  id: string;
  side: BodyAreaSide;
  label: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  accent: string;
};

export type PainLevelDescriptor = {
  label: string;
  description: string;
  tone: string;
  ring: string;
  fill: string;
};

export type SymptomSignalKey =
  | "cognitiveFog"
  | "headache"
  | "digestiveIssues"
  | "anxiety"
  | "depression"
  | "sensitivityLight"
  | "sensitivityNoise"
  | "stiffness";

export type SymptomSignalLevelKey =
  | "cognitiveFogLevel"
  | "headacheLevel"
  | "digestiveIssuesLevel"
  | "anxietyLevel"
  | "depressionLevel"
  | "sensitivityLightLevel"
  | "sensitivityNoiseLevel"
  | "stiffness";

export type SymptomSignalConfig = {
  key: SymptomSignalKey;
  levelKey: SymptomSignalLevelKey;
  label: string;
  description: string;
};

export const painTypes = [
  "Pontada",
  "Queimacao",
  "Pressao",
  "Rigidez",
  "Latejante",
  "Ardencia",
  "Sensacao de peso",
] as const;

export const painTriggers = [
  "Sono irregular",
  "Estresse emocional",
  "Clima frio",
  "Umidade alta",
  "Esforco fisico",
  "Longo periodo sentada",
  "Excesso de tela",
  "Pouca hidratacao",
  "Barulho intenso",
  "Luz forte",
] as const;

export const frontBodyAreas: BodyAreaDefinition[] = [
  {
    id: "front_jaw_left",
    side: "front",
    label: "Mandibula esquerda",
    description: "Regiao temporomandibular esquerda.",
    x: 31,
    y: 10,
    width: 14,
    height: 8,
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    id: "front_jaw_right",
    side: "front",
    label: "Mandibula direita",
    description: "Regiao temporomandibular direita.",
    x: 55,
    y: 10,
    width: 14,
    height: 8,
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    id: "front_shoulder_left",
    side: "front",
    label: "Ombro esquerdo",
    description: "Complexo do ombro esquerdo.",
    x: 17,
    y: 22,
    width: 22,
    height: 10,
    accent: "from-indigo-500 to-sky-400",
  },
  {
    id: "front_shoulder_right",
    side: "front",
    label: "Ombro direito",
    description: "Complexo do ombro direito.",
    x: 61,
    y: 22,
    width: 22,
    height: 10,
    accent: "from-indigo-500 to-sky-400",
  },
  {
    id: "front_upper_arm_left",
    side: "front",
    label: "Braco superior esquerdo",
    description: "Regiao do braco superior esquerdo.",
    x: 13,
    y: 34,
    width: 18,
    height: 14,
    accent: "from-sky-500 to-cyan-400",
  },
  {
    id: "front_upper_arm_right",
    side: "front",
    label: "Braco superior direito",
    description: "Regiao do braco superior direito.",
    x: 69,
    y: 34,
    width: 18,
    height: 14,
    accent: "from-sky-500 to-cyan-400",
  },
  {
    id: "front_lower_arm_left",
    side: "front",
    label: "Braco inferior esquerdo",
    description: "Antebraco esquerdo.",
    x: 10,
    y: 50,
    width: 16,
    height: 16,
    accent: "from-cyan-500 to-teal-400",
  },
  {
    id: "front_lower_arm_right",
    side: "front",
    label: "Braco inferior direito",
    description: "Antebraco direito.",
    x: 74,
    y: 50,
    width: 16,
    height: 16,
    accent: "from-cyan-500 to-teal-400",
  },
  {
    id: "front_chest",
    side: "front",
    label: "Torax",
    description: "Regiao central do torax.",
    x: 34,
    y: 28,
    width: 32,
    height: 14,
    accent: "from-rose-400 to-pink-400",
  },
  {
    id: "front_abdomen",
    side: "front",
    label: "Abdomen",
    description: "Regiao abdominal central.",
    x: 35,
    y: 44,
    width: 30,
    height: 16,
    accent: "from-amber-400 to-orange-400",
  },
  {
    id: "front_hip_left",
    side: "front",
    label: "Quadril esquerdo",
    description: "Regiao lateral do quadril esquerdo.",
    x: 28,
    y: 60,
    width: 18,
    height: 12,
    accent: "from-orange-400 to-red-400",
  },
  {
    id: "front_hip_right",
    side: "front",
    label: "Quadril direito",
    description: "Regiao lateral do quadril direito.",
    x: 54,
    y: 60,
    width: 18,
    height: 12,
    accent: "from-orange-400 to-red-400",
  },
  {
    id: "front_thigh_left",
    side: "front",
    label: "Coxa esquerda",
    description: "Face anterior da coxa esquerda.",
    x: 31,
    y: 72,
    width: 16,
    height: 22,
    accent: "from-red-400 to-pink-500",
  },
  {
    id: "front_thigh_right",
    side: "front",
    label: "Coxa direita",
    description: "Face anterior da coxa direita.",
    x: 53,
    y: 72,
    width: 16,
    height: 22,
    accent: "from-red-400 to-pink-500",
  },
  {
    id: "front_knee_left",
    side: "front",
    label: "Joelho esquerdo",
    description: "Regiao anterior do joelho esquerdo.",
    x: 32,
    y: 94,
    width: 14,
    height: 9,
    accent: "from-fuchsia-500 to-violet-500",
  },
  {
    id: "front_knee_right",
    side: "front",
    label: "Joelho direito",
    description: "Regiao anterior do joelho direito.",
    x: 54,
    y: 94,
    width: 14,
    height: 9,
    accent: "from-fuchsia-500 to-violet-500",
  },
];

export const backBodyAreas: BodyAreaDefinition[] = [
  {
    id: "back_cervical",
    side: "back",
    label: "Cervical",
    description: "Regiao posterior do pescoco.",
    x: 34,
    y: 12,
    width: 32,
    height: 9,
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    id: "back_upper_back",
    side: "back",
    label: "Costas superiores",
    description: "Regiao toracica posterior.",
    x: 28,
    y: 26,
    width: 44,
    height: 22,
    accent: "from-indigo-500 to-sky-400",
  },
  {
    id: "back_lower_back",
    side: "back",
    label: "Costas inferiores",
    description: "Regiao lombar posterior.",
    x: 30,
    y: 52,
    width: 40,
    height: 16,
    accent: "from-orange-400 to-rose-500",
  },
];

export const allBodyAreas = [...frontBodyAreas, ...backBodyAreas];

export const bodyAreaLabelById = Object.fromEntries(
  allBodyAreas.map((area) => [area.id, area.label]),
) as Record<string, string>;

export const symptomSignalCatalog: SymptomSignalConfig[] = [
  {
    key: "cognitiveFog",
    levelKey: "cognitiveFogLevel",
    label: "Fibro fog",
    description: "Esquecimentos, lentidao mental ou dificuldade de foco.",
  },
  {
    key: "headache",
    levelKey: "headacheLevel",
    label: "Cefaleia",
    description: "Dor de cabeca ou pressao craniana ao longo do dia.",
  },
  {
    key: "digestiveIssues",
    levelKey: "digestiveIssuesLevel",
    label: "Alteracoes digestivas",
    description: "Estufamento, nausea ou desconforto abdominal.",
  },
  {
    key: "anxiety",
    levelKey: "anxietyLevel",
    label: "Ansiedade",
    description: "Tensao interna, preocupacao ou aceleracao mental.",
  },
  {
    key: "depression",
    levelKey: "depressionLevel",
    label: "Humor depressivo",
    description: "Baixa energia emocional, desanimo ou tristeza persistente.",
  },
  {
    key: "sensitivityLight",
    levelKey: "sensitivityLightLevel",
    label: "Sensibilidade a luz",
    description: "Luz incomodando mais que o habitual.",
  },
  {
    key: "sensitivityNoise",
    levelKey: "sensitivityNoiseLevel",
    label: "Sensibilidade a ruido",
    description: "Barulhos incomodando mais que o habitual.",
  },
  {
    key: "stiffness",
    levelKey: "stiffness",
    label: "Rigidez corporal",
    description: "Sensacao de travamento ou endurecimento muscular.",
  },
];

export function resolvePainDescriptor(painLevel: number): PainLevelDescriptor {
  if (painLevel <= 0) {
    return {
      label: "Sem dor",
      description: "Sem desconforto perceptivel hoje.",
      tone: "text-emerald-700",
      ring: "ring-emerald-200",
      fill: "from-emerald-400 to-teal-400",
    };
  }

  if (painLevel <= 3) {
    return {
      label: "Dor leve",
      description: "Desconforto suportavel, com pouco impacto nas atividades.",
      tone: "text-emerald-700",
      ring: "ring-emerald-200",
      fill: "from-emerald-400 to-lime-400",
    };
  }

  if (painLevel <= 6) {
    return {
      label: "Dor moderada",
      description: "Interfere em parte da rotina e pede pausas conscientes.",
      tone: "text-amber-700",
      ring: "ring-amber-200",
      fill: "from-amber-400 to-orange-400",
    };
  }

  if (painLevel <= 9) {
    return {
      label: "Dor forte",
      description: "Interfere na maior parte das atividades do dia.",
      tone: "text-rose-700",
      ring: "ring-rose-200",
      fill: "from-rose-500 to-fuchsia-500",
    };
  }

  return {
    label: "Pior dor possivel",
    description: "Dor incapacitante, com impacto clinico importante.",
    tone: "text-red-700",
    ring: "ring-red-200",
    fill: "from-red-500 to-fuchsia-600",
  };
}

export function resolveBodyAreaLabels(ids: string[]): string[] {
  return ids
    .map((id) => bodyAreaLabelById[id] ?? id)
    .filter((label, index, values) => values.indexOf(label) === index);
}
