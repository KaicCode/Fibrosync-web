import { PrismaClient, SymptomCategory } from '@prisma/client';
import { slugify } from '../src/common/utils/slugify.util';

const prisma = new PrismaClient();

const defaultSymptoms: Array<{
  name: string;
  category: SymptomCategory;
  description: string;
  isCore?: boolean;
}> = [
  {
    name: 'Dor generalizada',
    category: SymptomCategory.PAIN,
    description: 'Sensacao difusa de dor musculoesqueletica ao longo do dia.',
    isCore: true,
  },
  {
    name: 'Fadiga extrema',
    category: SymptomCategory.FATIGUE,
    description: 'Sensacao persistente de cansaco que impacta a rotina.',
    isCore: true,
  },
  {
    name: 'Sono nao reparador',
    category: SymptomCategory.SLEEP,
    description: 'Qualidade de sono insuficiente mesmo apos horas adequadas.',
    isCore: true,
  },
  {
    name: 'Fibro fog',
    category: SymptomCategory.COGNITIVE,
    description: 'Dificuldade de concentracao, memoria ou clareza mental.',
    isCore: true,
  },
  {
    name: 'Rigidez matinal',
    category: SymptomCategory.MOBILITY,
    description: 'Rigidez muscular ou articular ao acordar.',
  },
  {
    name: 'Ansiedade',
    category: SymptomCategory.MOOD,
    description: 'Aumento da tensao emocional ou preocupacoes recorrentes.',
  },
  {
    name: 'Sensibilidade gastrointestinal',
    category: SymptomCategory.DIGESTIVE,
    description: 'Desconforto abdominal, inchaco ou alteracoes digestivas.',
  },
];

async function main(): Promise<void> {
  for (const symptom of defaultSymptoms) {
    await prisma.symptom.upsert({
      where: {
        slug: slugify(symptom.name),
      },
      update: {
        category: symptom.category,
        description: symptom.description,
        isCore: symptom.isCore ?? false,
        isActive: true,
      },
      create: {
        name: symptom.name,
        slug: slugify(symptom.name),
        category: symptom.category,
        description: symptom.description,
        isCore: symptom.isCore ?? false,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
