import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
  Cog,
  HeartPulse,
  LayoutDashboard,
  MessageCircleHeart,
  ShieldPlus,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  FileText,
  TrendingUp,
} from 'lucide-react'
import type { AppRole } from '@/store/app-store'

export type WorkspaceVariant = AppRole

export type NavigationItem = {
  label: string
  description: string
  to: string
  icon: LucideIcon
  badge?: string
  keywords?: string[]
}

export const patientNavigation: NavigationItem[] = [
  {
    label: 'Resumo',
    description: 'Visão geral do dia',
    to: '/app',
    icon: LayoutDashboard,
    keywords: ['dashboard', 'inicio', 'painel', 'visao geral', 'resumo'],
  },
  {
    label: 'Registro de dor',
    description: 'Capture sintomas e gatilhos',
    to: '/app/pain-log',
    icon: HeartPulse,
    keywords: ['dor', 'sintomas', 'gatilhos', 'crise', 'registro', 'saude'],
  },
  {
    label: 'Relatórios',
    description: 'Tendências, comparativos e exportações',
    to: '/app/reports',
    icon: BarChart3,
    keywords: ['relatorio', 'analise', 'historico', 'tendencias', 'comparativos'],
  },
  {
    label: 'Assistente IA',
    description: 'Insights e orientação contextual',
    to: '/app/assistant',
    icon: Sparkles,
    badge: 'Novo',
    keywords: ['ia', 'assistente', 'insights', 'orientacao', 'inteligencia artificial'],
  },
  {
    label: 'Calendário',
    description: 'Rotina, lembretes e próximos eventos',
    to: '/app/calendar',
    icon: CalendarDays,
    keywords: ['calendario', 'datas', 'lembretes', 'agenda', 'eventos'],
  },
  {
    label: 'Comunidade',
    description: 'Trocas seguras com outras pessoas',
    to: '/app/community',
    icon: MessageCircleHeart,
    keywords: ['comunidade', 'feed', 'pessoas', 'apoio', 'posts'],
  },
  {
    label: 'Perfil',
    description: 'Metas, evolução e conquistas',
    to: '/app/profile',
    icon: UserRound,
    keywords: ['perfil', 'metas', 'evolucao', 'dados pessoais'],
  },
  {
    label: 'Configurações',
    description: 'Preferências, alertas e privacidade',
    to: '/app/settings',
    icon: Cog,
    keywords: ['configuracoes', 'preferencias', 'privacidade', 'alertas', 'ajustes'],
  },
]

export const medicalNavigation: NavigationItem[] = [
  {
    label: 'Painel médico',
    description: 'Acompanhe pacientes, sinais e evolução',
    to: '/medical',
    icon: Stethoscope,
    keywords: ['medico', 'pacientes', 'evolucao', 'painel', 'clinico'],
  },
]

export const adminNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    description: 'Métricas e alertas do sistema',
    to: '/admin/dashboard',
    icon: LayoutDashboard,
    keywords: ['dashboard', 'metricas', 'alertas', 'painel', 'sistema'],
  },
  {
    label: 'Usuários',
    description: 'Gerenciar usuários da plataforma',
    to: '/admin/users',
    icon: Users,
    keywords: ['usuarios', 'pacientes', 'emails', 'contas', 'acessos'],
  },
  {
    label: 'Sintomas',
    description: 'Acompanhar sinais clínicos e registros',
    to: '/admin/symptoms',
    icon: HeartPulse,
    keywords: ['sintomas', 'registros', 'dor', 'sinais', 'clinicos'],
  },
  {
    label: 'Relatórios',
    description: 'Gerar e exportar dados',
    to: '/admin/reports',
    icon: FileText,
    keywords: ['relatorios', 'exportar', 'dados', 'documentos'],
  },
  {
    label: 'Análiticos',
    description: 'Padrões, gatilhos e correlações',
    to: '/admin/analytics',
    icon: TrendingUp,
    keywords: ['analiticos', 'analises', 'padroes', 'gatilhos', 'correlacoes'],
  },
  {
    label: 'Configurações',
    description: 'IA, notificações e limites de risco',
    to: '/admin/settings',
    icon: Cog,
    keywords: ['configuracoes', 'ia', 'notificacoes', 'limites', 'risco'],
  },
]

export const workspaceConfig = {
  patient: {
    shortLabel: 'Paciente',
    navigation: patientNavigation,
    searchPlaceholder: 'Buscar insights, sintomas ou lembretes...',
  },
  medical: {
    shortLabel: 'Médico',
    navigation: medicalNavigation,
    searchPlaceholder: 'Buscar pacientes, sintomas ou evolução...',
  },
  admin: {
    shortLabel: 'Admin',
    navigation: adminNavigation,
    searchPlaceholder: 'Buscar métricas, usuários ou relatórios...',
  },
} satisfies Record<
  WorkspaceVariant,
  {
    shortLabel: string
    navigation: NavigationItem[]
    searchPlaceholder: string
  }
>

export const workspaceDashboardPathByVariant: Record<WorkspaceVariant, string> = {
  patient: '/app',
  medical: '/medical',
  admin: '/admin/dashboard',
}

export const workspaceAiActivePathByVariant: Record<WorkspaceVariant, string> = {
  patient: '/app/ai-active',
  medical: '/medical/ai-active',
  admin: '/admin/ai-active',
}

export const workspaceSearchPathByVariant: Record<WorkspaceVariant, string> = {
  patient: '/app/search',
  medical: '/medical/search',
  admin: '/admin/search',
}

export const roleOptions: Array<{
  role: WorkspaceVariant
  label: string
  description: string
  href: string
  icon: LucideIcon
}> = [
  {
    role: 'patient',
    label: 'Paciente',
    description: 'Jornada pessoal',
    href: '/app',
    icon: HeartPulse,
  },
  {
    role: 'medical',
    label: 'Médico',
    description: 'Visão clínica',
    href: '/medical',
    icon: Stethoscope,
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'Operação e gestão',
    href: '/admin',
    icon: ShieldPlus,
  },
]

export function inferRoleFromPath(pathname: string): WorkspaceVariant {
  if (pathname.startsWith('/medical')) {
    return 'medical'
  }

  if (pathname.startsWith('/admin')) {
    return 'admin'
  }

  return 'patient'
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function matchesNavigationItem(item: NavigationItem, query: string): boolean {
  const normalizedQuery = normalizeSearchValue(query)

  if (!normalizedQuery) {
    return false
  }

  const haystack = [item.label, item.description, ...(item.keywords ?? [])]
    .map(normalizeSearchValue)
    .join(' ')

  return haystack.includes(normalizedQuery)
}
