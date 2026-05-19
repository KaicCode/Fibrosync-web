export type TrendPoint = {
  label: string
  value: number
  comparison?: number
}

export type SymptomPoint = {
  label: string
  value: number
  color: string
}

export const dashboardTrend: TrendPoint[] = [
  { label: 'Seg', value: 4.8, comparison: 3.9 },
  { label: 'Ter', value: 5.2, comparison: 4.1 },
  { label: 'Qua', value: 4.7, comparison: 3.8 },
  { label: 'Qui', value: 5.9, comparison: 4.3 },
  { label: 'Sex', value: 5.4, comparison: 4.2 },
  { label: 'Sáb', value: 6.1, comparison: 4.6 },
  { label: 'Dom', value: 5.6, comparison: 4.4 },
]

export const sleepTrend: TrendPoint[] = [
  { label: 'Seg', value: 6.8 },
  { label: 'Ter', value: 7.1 },
  { label: 'Qua', value: 6.5 },
  { label: 'Qui', value: 7.4 },
  { label: 'Sex', value: 7.2 },
  { label: 'Sáb', value: 7.8 },
  { label: 'Dom', value: 7.3 },
]

export const dailySummary = [
  { label: 'Fadiga', value: 'Alta', tone: 'warning' as const },
  { label: 'Estresse', value: 'Médio', tone: 'default' as const },
  { label: 'Passos', value: '4.350', tone: 'success' as const },
  { label: 'Hidratação', value: '1,9L', tone: 'default' as const },
]

export const aiInsights = [
  {
    title: 'Pico de dor no fim da tarde',
    description:
      'A intensidade aumentou nos últimos 3 dias entre 17h e 20h, junto com longos períodos sentada.',
  },
  {
    title: 'Sono e recuperação em melhora',
    description:
      'Os episódios de despertar noturno caíram 14% após a rotina de relaxamento noturno.',
  },
  {
    title: 'Padrão emocional mais estável',
    description:
      'Seu humor ficou mais consistente quando você registrou pausas e caminhadas leves.',
  },
]

export const symptomBreakdown: SymptomPoint[] = [
  { label: 'Fadiga', value: 80, color: '#B668FF' },
  { label: 'Dor muscular', value: 70, color: '#FF9A4D' },
  { label: 'Sono não reparador', value: 60, color: '#53A2FF' },
  { label: 'Ansiedade', value: 40, color: '#7ED7B1' },
]

export const reportTrend: TrendPoint[] = [
  { label: 'Seg', value: 3.2, comparison: 4.1 },
  { label: 'Ter', value: 4.5, comparison: 4.4 },
  { label: 'Qua', value: 4.8, comparison: 4.5 },
  { label: 'Qui', value: 3.7, comparison: 4.2 },
  { label: 'Sex', value: 5.9, comparison: 4.9 },
  { label: 'Sáb', value: 5.6, comparison: 4.8 },
  { label: 'Dom', value: 6.4, comparison: 5.0 },
]

export const reportHighlights = [
  { label: 'Dor média', value: '5,4', hint: 'Moderada' },
  { label: 'Variação semanal', value: '+10%', hint: 'vs semana anterior' },
  { label: 'Dias com registro', value: '6/7', hint: 'Excelente aderência' },
]

export const painTypes = ['Pontadas', 'Queimação', 'Peso', 'Rigidez', 'Latejante']

export const painTriggers = [
  'Sono irregular',
  'Estresse',
  'Período menstrual',
  'Clima frio',
  'Excesso de tela',
  'Sedentarismo',
]

export const aiConversation = [
  {
    role: 'assistant' as const,
    text: 'Olá, Juliana! Sou sua assistente FibroSync. Como posso te ajudar hoje?',
    time: '09:12',
  },
  {
    role: 'user' as const,
    text: 'Por que minha dor aumenta à noite?',
    time: '09:13',
  },
  {
    role: 'assistant' as const,
    text: 'A dor pode aumentar à noite pela fadiga acumulada, rigidez após longos períodos sentada e maior sensibilidade ao estresse. Posso sugerir uma rotina de alívio em 5 minutos.',
    time: '09:14',
  },
]

export const aiSuggestions = [
  {
    title: 'Respiração profunda',
    subtitle: 'Técnica recomendada',
    detail: '5 min',
  },
  {
    title: 'Alongamento cervical',
    subtitle: 'Alívio rápido',
    detail: '3 movimentos',
  },
  {
    title: 'Checklist noturno',
    subtitle: 'Reduz gatilhos',
    detail: '4 passos',
  },
]

export const calendarDays = [
  { day: 27, muted: true },
  { day: 28, muted: true },
  { day: 29, muted: true },
  { day: 30, muted: true },
  { day: 1 },
  { day: 2 },
  { day: 3 },
  { day: 4 },
  { day: 5 },
  { day: 6 },
  { day: 7 },
  { day: 8 },
  { day: 9 },
  { day: 10 },
  { day: 11 },
  { day: 12 },
  { day: 13 },
  { day: 14 },
  { day: 15 },
  { day: 16 },
  { day: 17 },
  { day: 18 },
  { day: 19 },
  { day: 20 },
  { day: 21 },
  { day: 22 },
  { day: 23 },
  { day: 24, active: true },
  { day: 25 },
  { day: 26 },
  { day: 27 },
  { day: 28 },
  { day: 29 },
  { day: 30 },
  { day: 31 },
]

export const calendarEvents = [
  { time: '10:00', title: 'Dor moderada', color: '#FF6B6B' },
  { time: '14:30', title: 'Fadiga alta', color: '#FFB547' },
  { time: '20:15', title: 'Ansiedade leve', color: '#48C6A3' },
]

export const communityPosts = [
  {
    author: 'Carla Silva',
    handle: '@carla',
    avatar: 'https://i.pravatar.cc/120?img=10',
    text: 'Hoje foi um dia difícil, mas consegui fazer minha caminhada leve. Pequenas vitórias contam.',
    time: '2h',
    likes: 12,
    comments: 12,
    badge: 'Feed',
  },
  {
    author: 'Ana Paula',
    handle: '@ana',
    avatar: 'https://i.pravatar.cc/120?img=32',
    text: 'Alguém tem dicas para melhorar a qualidade do sono nos dias de dor muscular intensa?',
    time: '5h',
    likes: 8,
    comments: 9,
    badge: 'Pergunta',
  },
  {
    author: 'Marina Costa',
    handle: '@marina',
    avatar: 'https://i.pravatar.cc/120?img=47',
    text: 'Comecei a registrar meus gatilhos e finalmente percebi padrão entre estresse e rigidez matinal.',
    time: 'Ontem',
    likes: 26,
    comments: 14,
    badge: 'Insight',
  },
]

export const profileStats = [
  { label: 'Registros', value: '128' },
  { label: 'Sequência', value: '12 dias' },
  { label: 'Conquistas', value: '8' },
]

export const profileProgress = [
  { label: 'Meu progresso', value: 78 },
  { label: 'Sono reparador', value: 64 },
  { label: 'Rotina de pausas', value: 86 },
]

export const profileSettings = [
  'Lembretes',
  'Preferências de notificação',
  'Metas semanais',
  'Privacidade e compartilhamento',
]

export const medicalPatients = [
  {
    name: 'Juliana Santos',
    avatar: 'https://i.pravatar.cc/120?img=44',
    update: 'Última atualização hoje',
    painLevel: '5,4',
    records: 128,
    adherence: 92,
  },
  {
    name: 'Roberta Lima',
    avatar: 'https://i.pravatar.cc/120?img=24',
    update: 'Atualização há 1 dia',
    painLevel: '4,1',
    records: 94,
    adherence: 88,
  },
  {
    name: 'Vanessa Mota',
    avatar: 'https://i.pravatar.cc/120?img=16',
    update: 'Atualização há 3 dias',
    painLevel: '6,2',
    records: 152,
    adherence: 79,
  },
]

export const medicalTrend: TrendPoint[] = [
  { label: '18/05', value: 4.4 },
  { label: '19/05', value: 5.1 },
  { label: '20/05', value: 4.8 },
  { label: '21/05', value: 5.7 },
  { label: '22/05', value: 5.0 },
  { label: '23/05', value: 6.0 },
  { label: '24/05', value: 5.6 },
]

export const adminMetrics = [
  { label: 'Usuários ativos', value: '12.540', trend: '+12%' },
  { label: 'Novos usuários', value: '1.250', trend: '+8%' },
  { label: 'Receita', value: 'R$ 45.780', trend: '+18%' },
  { label: 'Retenção', value: '68%', trend: '+6%' },
]

export const adminRevenue = [
  { label: 'Jan', value: 12 },
  { label: 'Fev', value: 18 },
  { label: 'Mar', value: 26 },
  { label: 'Abr', value: 20 },
  { label: 'Mai', value: 34 },
  { label: 'Jun', value: 28 },
  { label: 'Jul', value: 40 },
]

export const adminActivity = [
  { title: 'Novo usuário cadastrado', time: 'Hoje', color: '#48C6A3' },
  { title: 'Relatório gerado', time: 'Hoje', color: '#7B4DFF' },
  { title: 'Novo post na comunidade', time: 'Hoje', color: '#FF61A6' },
  { title: 'Upgrade para Premium Care', time: 'Ontem', color: '#5C87FF' },
]

export const retentionSegments = [
  { label: 'Ativas', value: 68, color: '#7B4DFF' },
  { label: 'Em risco', value: 20, color: '#B998FF' },
  { label: 'Recuperadas', value: 12, color: '#5C87FF' },
]

export const bodyPointLabels = {
  ombros: 'Ombros',
  lombar: 'Lombar',
  quadril: 'Quadril',
  joelhos: 'Joelhos',
  punhos: 'Punhos',
  cervical: 'Cervical',
} satisfies Record<string, string>
