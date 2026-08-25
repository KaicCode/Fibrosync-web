import { AccountStatus, PrismaClient, Role } from '@prisma/client';

function readArgument(name: string): string | null {
  const prefix = `--${name}=`;

  for (let index = 0; index < process.argv.length; index += 1) {
    const current = process.argv[index] ?? '';

    if (current === `--${name}`) {
      return process.argv[index + 1] ?? null;
    }

    if (current.startsWith(prefix)) {
      return current.slice(prefix.length);
    }
  }

  return null;
}

function printUsage(): void {
  console.error(
    'Uso: npm run users:activate-medical -- --email medico@exemplo.com',
  );
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    const rawEmail =
      readArgument('email') ?? process.env.MEDICAL_USER_EMAIL ?? null;

    if (!rawEmail) {
      printUsage();
      process.exitCode = 1;
      return;
    }

    const email = rawEmail.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        onboardingCompleted: true,
        specialty: true,
        professionalCouncilType: true,
        professionalCouncilNumber: true,
        professionalCouncilState: true,
      },
    });

    if (!existingUser) {
      console.error(`Nenhum usuário ativo encontrado para ${email}.`);
      process.exitCode = 1;
      return;
    }

    if (existingUser.role !== Role.MEDICAL) {
      console.error(
        `O usuário ${email} não é médico. Role atual: ${existingUser.role}.`,
      );
      process.exitCode = 1;
      return;
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        onboardingCompleted: true,
        accountStatus: AccountStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        onboardingCompleted: true,
        specialty: true,
        professionalCouncilType: true,
        professionalCouncilNumber: true,
        professionalCouncilState: true,
        updatedAt: true,
      },
    });

    console.log('Conta médica ativada com sucesso:');
    console.log(JSON.stringify(updatedUser, null, 2));

    if (
      !updatedUser.specialty ||
      !updatedUser.professionalCouncilType ||
      !updatedUser.professionalCouncilNumber ||
      !updatedUser.professionalCouncilState
    ) {
      console.warn(
        'Aviso: a conta foi ativada, mas ainda há dados profissionais incompletos.',
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
