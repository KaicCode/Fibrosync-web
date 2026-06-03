import process from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, SymptomCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { slugify } from '../src/common/utils/slugify.util';

process.loadEnvFile('.env');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
});
const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
const adminSeedEmail =
  process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase() ?? 'admin@fibrosync.local';
const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD ?? 'Admin12345!';
const adminSeedFullName =
  process.env.ADMIN_SEED_FULL_NAME?.trim() ?? 'FibroSync Admin';

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

async function ensureAdminUser(): Promise<void> {
  const passwordHash = await bcrypt.hash(adminSeedPassword, bcryptSaltRounds);

  await prisma.user.upsert({
    where: {
      email: adminSeedEmail,
    },
    update: {
      fullName: adminSeedFullName,
      passwordHash,
      role: Role.ADMIN,
      onboardingCompleted: true,
      timezone: 'America/Sao_Paulo',
      deletedAt: null,
    },
    create: {
      email: adminSeedEmail,
      passwordHash,
      fullName: adminSeedFullName,
      role: Role.ADMIN,
      onboardingCompleted: true,
      timezone: 'America/Sao_Paulo',
    },
  });
}

async function main(): Promise<void> {
  await ensureAdminUser();

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
