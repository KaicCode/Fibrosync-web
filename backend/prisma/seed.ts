import process from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, SymptomCategory, ExerciseCategory, ExerciseDifficulty } from '@prisma/client';
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
  process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase() ??
  'fibrosyncadmin@gmail.com';
const legacyAdminSeedEmail = 'admin@fibrosync.local';
const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD ?? '2026Admin@$';
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
    name: 'Dificuldade de Concentração',
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
  const adminData = {
    fullName: adminSeedFullName,
    passwordHash,
    role: Role.ADMIN,
    onboardingCompleted: true,
    timezone: 'America/Sao_Paulo',
    deletedAt: null,
  } as const;

  if (adminSeedEmail !== legacyAdminSeedEmail) {
    const [targetAdmin, legacyAdmin] = await Promise.all([
      prisma.user.findUnique({
        where: {
          email: adminSeedEmail,
        },
      }),
      prisma.user.findUnique({
        where: {
          email: legacyAdminSeedEmail,
        },
      }),
    ]);

    if (!targetAdmin && legacyAdmin) {
      await prisma.user.update({
        where: {
          id: legacyAdmin.id,
        },
        data: {
          email: adminSeedEmail,
          ...adminData,
        },
      });

      return;
    }
  }

  await prisma.user.upsert({
    where: {
      email: adminSeedEmail,
    },
    update: {
      ...adminData,
    },
    create: {
      email: adminSeedEmail,
      ...adminData,
    },
  });
}

// ─── Exercícios para fibromialgia ─────────────────────────────────────────
const defaultExercises: Array<{
  title: string;
  description: string;
  imageUrl: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  durationMinutes: number;
  instructions: string[];
  benefits: string[];
  precautions: string[];
}> = [
  {
    title: 'Alongamento Cervical',
    description: 'Movimento suave para aliviar a tensão no pescoço e na base do crânio.',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    category: ExerciseCategory.STRETCHING,
    difficulty: ExerciseDifficulty.VERY_EASY,
    durationMinutes: 5,
    instructions: [
      'Sente-se confortavelmente com a coluna ereta.',
      'Incline lentamente a cabeça para o lado direito, levando a orelha ao ombro.',
      'Mantenha por 20 a 30 segundos. Respire fundo.',
      'Retorne ao centro e repita para o lado esquerdo.',
      'Faça 3 repetições de cada lado.',
    ],
    benefits: ['Alivia tensão cervical', 'Reduz dores de cabeça tensionais', 'Melhora a mobilidade do pescoço'],
    precautions: ['Nunca force o movimento', 'Pare se sentir dor aguda', 'Não gire o pescoço em círculos completos'],
  },
  {
    title: 'Respiração Diafragmática',
    description: 'Técnica de respiração profunda que ativa o sistema nervoso parassimpático e reduz a tensão muscular.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
    category: ExerciseCategory.BREATHING,
    difficulty: ExerciseDifficulty.VERY_EASY,
    durationMinutes: 8,
    instructions: [
      'Deite-se de costas ou sente-se em posição confortável.',
      'Coloque uma mão no peito e outra no abdômen.',
      'Inspire lentamente pelo nariz contando até 4, sentindo o abdômen subir.',
      'Segure o ar por 2 segundos.',
      'Expire lentamente pela boca contando até 6, sentindo o abdômen descer.',
      'Repita por 8 a 10 ciclos.',
    ],
    benefits: ['Reduz o estresse e a tensão', 'Diminui a percepção de dor', 'Melhora a qualidade do sono'],
    precautions: ['Pratique em ambiente tranquilo', 'Se sentir tontura, respire normalmente', 'Não force a respiração'],
  },
  {
    title: 'Caminhada Leve',
    description: 'Caminhada de baixa intensidade para estimular a circulação e liberar endorfinas de forma segura.',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    category: ExerciseCategory.WALKING,
    difficulty: ExerciseDifficulty.EASY,
    durationMinutes: 15,
    instructions: [
      'Escolha um local plano e seguro para caminhar.',
      'Inicie em ritmo muito lento por 2 minutos para aquecimento.',
      'Mantenha um ritmo confortável onde ainda consiga conversar.',
      'Caminhe por 10 a 15 minutos no total.',
      'Finalize com 2 minutos de ritmo mais lento para desaquecimento.',
    ],
    benefits: ['Melhora a circulação sanguínea', 'Libera endorfinas naturais', 'Fortalece gradualmente a musculatura'],
    precautions: ['Use calçados confortáveis', 'Evite calor excessivo', 'Pare se sentir dor intensa ou falta de ar'],
  },
  {
    title: 'Mobilidade dos Ombros',
    description: 'Exercícios suaves para aumentar a amplitude de movimento dos ombros e reduzir a rigidez.',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
    category: ExerciseCategory.MOBILITY,
    difficulty: ExerciseDifficulty.VERY_EASY,
    durationMinutes: 6,
    instructions: [
      'Fique em pé ou sentado com os braços relaxados ao lado do corpo.',
      'Eleve os ombros em direção às orelhas, mantendo por 3 segundos.',
      'Abaixe lentamente e relaxe.',
      'Faça círculos pequenos com os ombros para frente (5 vezes).',
      'Repita os círculos para trás (5 vezes).',
      'Realize 3 séries completas.',
    ],
    benefits: ['Reduz a rigidez matinal', 'Melhora a postura', 'Alivia tensão nos trapézios'],
    precautions: ['Movimentos sempre lentos e controlados', 'Não force caso sinta crepitação dolorosa'],
  },
  {
    title: 'Alongamento Lombar Deitado',
    description: 'Alongamento suave para alívio da tensão na região lombar, realizado deitado.',
    imageUrl: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400',
    category: ExerciseCategory.STRETCHING,
    difficulty: ExerciseDifficulty.VERY_EASY,
    durationMinutes: 8,
    instructions: [
      'Deite-se de costas em superfície firme e confortável.',
      'Dobre os joelhos e mantenha os pés apoiados no chão.',
      'Abrace os dois joelhos com os braços e puxe suavemente em direção ao peito.',
      'Mantenha por 30 segundos respirando profundamente.',
      'Retorne os pés ao chão lentamente.',
      'Repita 3 vezes.',
    ],
    benefits: ['Alivia dor lombar', 'Relaxa os músculos paravertebrais', 'Melhora a flexibilidade da coluna'],
    precautions: ['Evite se tiver hérnia de disco sem orientação médica', 'Movimentos sempre lentos'],
  },
  {
    title: 'Relaxamento Muscular Progressivo',
    description: 'Técnica de tensionar e relaxar grupos musculares para liberar a tensão acumulada em todo o corpo.',
    imageUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400',
    category: ExerciseCategory.RELAXATION,
    difficulty: ExerciseDifficulty.VERY_EASY,
    durationMinutes: 15,
    instructions: [
      'Deite-se confortavelmente e feche os olhos.',
      'Comece pelos pés: contraia os músculos por 5 segundos, depois relaxe completamente.',
      'Suba para as panturrilhas: tensione por 5 segundos, relaxe.',
      'Continue subindo pelo corpo (coxas, abdômen, mãos, braços, ombros, rosto).',
      'Em cada grupo muscular, observe a diferença entre tensão e relaxamento.',
      'Finalize respirando profundamente por 2 minutos.',
    ],
    benefits: ['Reduz a tensão muscular generalizada', 'Diminui a ansiedade', 'Melhora a qualidade do sono'],
    precautions: ['Pratique em ambiente tranquilo', 'Não contraia com força excessiva'],
  },
  {
    title: 'Mobilidade do Quadril',
    description: 'Movimentos circulares e de abertura para aliviar a rigidez e melhorar a mobilidade do quadril.',
    imageUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400',
    category: ExerciseCategory.MOBILITY,
    difficulty: ExerciseDifficulty.EASY,
    durationMinutes: 8,
    instructions: [
      'Fique em pé com as mãos apoiadas em uma cadeira ou parede para equilíbrio.',
      'Faça círculos lentos com o quadril no sentido horário (5 vezes).',
      'Repita no sentido anti-horário (5 vezes).',
      'Em seguida, eleve o joelho direito lentamente até a altura do quadril e abaixe.',
      'Repita 5 vezes com cada perna.',
    ],
    benefits: ['Aumenta a amplitude do quadril', 'Alivia dor nos glúteos', 'Melhora o equilíbrio'],
    precautions: ['Use apoio para segurança', 'Evite movimentos bruscos', 'Pare se sentir dor nas articulações'],
  },
  {
    title: 'Yoga Suave — Postura da Criança',
    description: 'Postura restaurativa de yoga que alonga as costas, quadril e ombros enquanto promove relaxamento.',
    imageUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400',
    category: ExerciseCategory.RELAXATION,
    difficulty: ExerciseDifficulty.VERY_EASY,
    durationMinutes: 5,
    instructions: [
      'Ajoelhe-se em um tapete confortável.',
      'Separe os joelhos na largura dos quadris e junte os dedões dos pés.',
      'Incline o tronco para frente lentamente, estendendo os braços à frente.',
      'Apoie a testa no chão ou em um travesseiro.',
      'Mantenha a posição por 1 a 3 minutos, respirando profundamente.',
      'Suba devagar, vértebra por vértebra.',
    ],
    benefits: ['Alonga a coluna lombar', 'Relaxa a mente e o corpo', 'Reduz a tensão nos ombros e pescoço'],
    precautions: ['Use travesseiro se não alcançar o chão', 'Evite se tiver problemas nos joelhos'],
  },
  {
    title: 'Alongamento de Panturrilha',
    description: 'Alongamento da parte posterior da perna para aliviar câimbras e melhorar a circulação.',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    category: ExerciseCategory.STRETCHING,
    difficulty: ExerciseDifficulty.EASY,
    durationMinutes: 5,
    instructions: [
      'Fique em pé de frente para uma parede, com as mãos apoiadas nela.',
      'Dê um passo para trás com a perna direita, mantendo o calcanhar no chão.',
      'Curve levemente o joelho da perna da frente e sinta o alongamento na panturrilha direita.',
      'Mantenha por 20 a 30 segundos.',
      'Troque as pernas e repita.',
      'Faça 3 repetições de cada lado.',
    ],
    benefits: ['Alivia câimbras noturnas', 'Melhora a circulação nas pernas', 'Reduz a tensão na sola do pé'],
    precautions: ['Mantenha o calcanhar sempre no chão', 'Não force o joelho'],
  },
  {
    title: 'Fortalecimento Suave de Core',
    description: 'Exercícios leves para ativar e fortalecer a musculatura central sem sobrecarregar a coluna.',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    category: ExerciseCategory.STRENGTHENING,
    difficulty: ExerciseDifficulty.EASY,
    durationMinutes: 10,
    instructions: [
      'Deite-se de costas com os joelhos dobrados e pés apoiados.',
      'Contraia suavemente o abdômen (como se fosse apertar o umbigo contra a coluna).',
      'Mantenha a contração e expire lentamente. Faça 10 repetições.',
      'Em seguida, eleve levemente o quadril do chão (ponte), mantendo por 5 segundos.',
      'Desça lentamente. Faça 8 repetições.',
    ],
    benefits: ['Estabiliza a coluna lombar', 'Reduz dores nas costas', 'Melhora a postura no dia a dia'],
    precautions: ['Nunca segure a respiração', 'Não force se sentir dor lombar aguda'],
  },
  {
    title: 'Alongamento de Quadríceps',
    description: 'Alongamento da parte frontal da coxa para reduzir tensão e melhorar a flexibilidade.',
    imageUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400',
    category: ExerciseCategory.STRETCHING,
    difficulty: ExerciseDifficulty.EASY,
    durationMinutes: 5,
    instructions: [
      'Fique em pé próximo a uma parede ou cadeira para apoio.',
      'Dobre o joelho direito e segure o tornozelo direito com a mão direita.',
      'Mantenha os joelhos juntos e o corpo ereto.',
      'Segure por 20 a 30 segundos sentindo o alongamento na parte frontal da coxa.',
      'Troque as pernas e repita.',
      'Faça 3 repetições de cada lado.',
    ],
    benefits: ['Alivia tensão nas coxas', 'Melhora a flexibilidade', 'Reduz dores nos joelhos'],
    precautions: ['Use apoio para não perder o equilíbrio', 'Não torça o tornozelo'],
  },
  {
    title: 'Mobilidade dos Tornozelos',
    description: 'Rotações e movimentos dos tornozelos para melhorar a circulação e reduzir o inchaço.',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    category: ExerciseCategory.MOBILITY,
    difficulty: ExerciseDifficulty.VERY_EASY,
    durationMinutes: 4,
    instructions: [
      'Sente-se confortavelmente e eleve levemente um pé do chão.',
      'Faça círculos lentos com o tornozelo no sentido horário (10 vezes).',
      'Repita no sentido anti-horário (10 vezes).',
      'Flexione e estenda o pé (como pisar no acelerador) 10 vezes.',
      'Troque para o outro tornozelo.',
    ],
    benefits: ['Melhora a circulação nas pernas', 'Reduz o inchaço', 'Previne câimbras nos pés'],
    precautions: ['Movimentos lentos e dentro do conforto', 'Interrompa se sentir dor nas articulações'],
  },
  {
    title: 'Respiração 4-7-8',
    description: 'Técnica de respiração que induz relaxamento profundo e reduz a hiperativação do sistema nervoso.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
    category: ExerciseCategory.BREATHING,
    difficulty: ExerciseDifficulty.EASY,
    durationMinutes: 5,
    instructions: [
      'Sente-se com a coluna ereta ou deite-se.',
      'Expire completamente pela boca.',
      'Feche a boca e inspire pelo nariz contando até 4.',
      'Segure o ar contando até 7.',
      'Expire lentamente pela boca contando até 8.',
      'Repita o ciclo de 4 a 8 vezes.',
    ],
    benefits: ['Reduz a ansiedade rapidamente', 'Melhora o foco', 'Auxilia no adormecimento'],
    precautions: ['Pode causar leve tontura nas primeiras vezes — é normal', 'Não pratique ao volante'],
  },
  {
    title: 'Fortalecimento Suave dos Glúteos',
    description: 'Exercícios em posição deitada para ativar e fortalecer os glúteos sem impacto nas articulações.',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
    category: ExerciseCategory.STRENGTHENING,
    difficulty: ExerciseDifficulty.EASY,
    durationMinutes: 10,
    instructions: [
      'Deite-se de costas com os joelhos dobrados e pés apoiados no chão.',
      'Contraia os glúteos e eleve o quadril formando uma linha reta (posição de ponte).',
      'Mantenha por 5 segundos e desça lentamente.',
      'Faça 10 repetições.',
      'Descanse por 1 minuto e repita por mais 2 séries.',
    ],
    benefits: ['Fortalece os glúteos e paravertebrais', 'Alivia dor lombar', 'Estabiliza o quadril'],
    precautions: ['Não eleve o quadril além do confortável', 'Contraia o core durante o movimento'],
  },
  {
    title: 'Alongamento dos Flexores do Quadril',
    description: 'Alongamento para aliviar a tensão na parte frontal do quadril, comum em quem passa muito tempo sentado.',
    imageUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400',
    category: ExerciseCategory.STRETCHING,
    difficulty: ExerciseDifficulty.EASY,
    durationMinutes: 6,
    instructions: [
      'Ajoelhe-se com o joelho direito no chão e o pé esquerdo à frente (posição de ajoelhamento).',
      'Deslize o corpo suavemente para frente até sentir o alongamento na parte frontal do quadril direito.',
      'Mantenha por 20 a 30 segundos.',
      'Retorne e troque as pernas.',
      'Faça 2 repetições de cada lado.',
    ],
    benefits: ['Alivia a tensão do quadril', 'Melhora a postura', 'Reduz dores lombares causadas por flexores encurtados'],
    precautions: ['Use um apoio macio embaixo do joelho', 'Não force a inclinação para frente'],
  },
  {
    title: 'Mobilidade dos Punhos e Mãos',
    description: 'Exercícios para manter a flexibilidade e reduzir a rigidez nas mãos, punhos e dedos.',
    imageUrl: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400',
    category: ExerciseCategory.MOBILITY,
    difficulty: ExerciseDifficulty.VERY_EASY,
    durationMinutes: 4,
    instructions: [
      'Sente-se com os braços estendidos à frente.',
      'Abra e feche as mãos lentamente (10 vezes).',
      'Faça círculos com os punhos no sentido horário e anti-horário (10 vezes cada).',
      'Dobre os dedos um a um e depois estenda-os.',
      'Termine pressionando levemente as pontas dos dedos de uma mão contra a outra.',
    ],
    benefits: ['Reduz a rigidez matinal nas mãos', 'Melhora a destreza', 'Alivia a tensão nos punhos'],
    precautions: ['Movimentos lentos sem forçar as articulações', 'Pare se sentir dormência'],
  },
  {
    title: 'Yoga Suave — Postura do Gato e da Vaca',
    description: 'Sequência de yoga para a coluna que combina extensão e flexão, aliviando rigidez e dor.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
    category: ExerciseCategory.MOBILITY,
    difficulty: ExerciseDifficulty.EASY,
    durationMinutes: 6,
    instructions: [
      'Fique em quatro apoios com punhos sob os ombros e joelhos sob o quadril.',
      'GATO: Expire e curve as costas para cima, abaixando a cabeça.',
      'VACA: Inspire e arqueie as costas para baixo, elevando o olhar.',
      'Alterne entre as duas posições lentamente, sincronizando com a respiração.',
      'Repita por 8 a 10 ciclos completos.',
    ],
    benefits: ['Mobiliza toda a coluna', 'Alivia rigidez matinal', 'Melhora a coordenação respiratória'],
    precautions: ['Use um tapete para proteger os joelhos', 'Não force a extensão do pescoço'],
  },
  {
    title: 'Caminhada Consciente',
    description: 'Versão meditativa da caminhada, focando na respiração e nas sensações corporais a cada passo.',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    category: ExerciseCategory.WALKING,
    difficulty: ExerciseDifficulty.EASY,
    durationMinutes: 20,
    instructions: [
      'Escolha um percurso tranquilo e plano.',
      'Inicie a caminhada em ritmo lento e regular.',
      'A cada passo, observe o contato do pé com o chão.',
      'Sincronize: inspire por 3 passos, expire por 3 passos.',
      'Se a mente divagar, retorne o foco para os passos e a respiração.',
      'Caminhe por 15 a 20 minutos.',
    ],
    benefits: ['Reduz a ansiedade e o estresse', 'Melhora o humor', 'Fortalece gradualmente as pernas'],
    precautions: ['Evite ruas movimentadas', 'Use calçado adequado', 'Leve água'],
  },
  {
    title: 'Fortalecimento dos Braços com Peso Leve',
    description: 'Exercícios com peso mínimo (garrafa d\'água) para manter a força muscular nos braços sem sobrecarga.',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    category: ExerciseCategory.STRENGTHENING,
    difficulty: ExerciseDifficulty.MODERATE,
    durationMinutes: 10,
    instructions: [
      'Sente-se com uma garrafa de água (500ml) em cada mão.',
      'Flexão de cotovelo: dobre e estenda os braços alternadamente (10 vezes cada).',
      'Elevação lateral: eleve os braços até a altura dos ombros e desça lentamente (8 vezes).',
      'Descanse por 2 minutos entre as séries.',
      'Realize 2 séries de cada exercício.',
    ],
    benefits: ['Mantém a força nos braços', 'Facilita as atividades diárias', 'Estimula a circulação nos membros superiores'],
    precautions: ['Use peso muito leve (máximo 500g a 1kg)', 'Movimentos lentos e controlados', 'Pare se sentir dor nas articulações'],
  },
  {
    title: 'Relaxamento Guiado com Visualização',
    description: 'Técnica de relaxamento que combina respiração profunda com imagens mentais positivas para reduzir a dor.',
    imageUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400',
    category: ExerciseCategory.RELAXATION,
    difficulty: ExerciseDifficulty.VERY_EASY,
    durationMinutes: 12,
    instructions: [
      'Deite-se ou sente-se confortavelmente em local silencioso.',
      'Feche os olhos e faça 5 respirações profundas.',
      'Imagine um lugar tranquilo e seguro (praia, floresta, jardim).',
      'Visualize os detalhes: cores, sons, texturas, cheiros.',
      'Permaneça nessa visualização por 8 a 10 minutos, respirando lentamente.',
      'Retorne gradualmente, movendo levemente os dedos das mãos e dos pés.',
    ],
    benefits: ['Reduz a percepção de dor', 'Diminui o estresse e a tensão', 'Melhora o bem-estar emocional'],
    precautions: ['Pratique em ambiente confortável', 'Não force se a mente divagar — é normal'],
  },
];

async function seedExercises(): Promise<void> {
  for (const exercise of defaultExercises) {
    // Usa upsert pelo título para evitar duplicatas ao re-executar o seed
    await prisma.exercise.upsert({
      where: {
        title: exercise.title,
      } as never,
      update: {
        description: exercise.description,
        imageUrl: exercise.imageUrl,
        category: exercise.category,
        difficulty: exercise.difficulty,
        durationMinutes: exercise.durationMinutes,
        instructions: exercise.instructions,
        benefits: exercise.benefits,
        precautions: exercise.precautions,
        isActive: true,
      },
      create: exercise,
    });
  }
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

  await seedExercises();
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
