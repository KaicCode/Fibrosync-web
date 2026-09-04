import type { LucideIcon } from 'lucide-react'
import { matchPath } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  Cog,
  HeartPulse,
  LayoutDashboard,
  MessageCircleHeart,
  PersonStanding,
  ShieldPlus,
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
  /**
   * Marks this item as the owner of a route subtree (e.g. a list page that
   * has a real detail route nested under it, like `/medical/patients/:id`).
   * Only set this when a child route genuinely exists — leave it unset so
   * the item only matches its exact `to` path, which is what keeps a
   * dashboard/root item (e.g. `/app`) from lighting up on every sibling
   * route nested under the same first path segment.
   */
  matchDescendants?: boolean
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
    label: 'Movimento Diário',
    description: 'Exercícios físicos e hábitos saudáveis',
    to: '/app/movement',
    icon: PersonStanding,
    keywords: ['movimento', 'exercicio', 'atividade', 'fisico', 'habito', 'alongamento', 'caminhada'],
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
    label: 'Profissionais',
    description: 'Código de vínculo e autorizações médicas',
    to: '/app/professionals',
    icon: Stethoscope,
    keywords: ['profissionais', 'medico', 'codigo', 'vinculo', 'autorizacoes'],
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
    description: 'Visão geral do acompanhamento clínico',
    to: '/medical',
    icon: Stethoscope,
    keywords: ['medico', 'pacientes', 'evolucao', 'painel', 'clinico'],
  },
  {
    label: 'Meus pacientes',
    description: 'Lista de pacientes com vínculo ativo',
    to: '/medical/patients',
    icon: Users,
    keywords: ['pacientes', 'vinculos', 'acompanhamento', 'buscar paciente'],
    // Owns /medical/patients/:patientId, so it should stay active there too.
    matchDescendants: true,
  },
  {
    label: 'Relatórios',
    description: 'Gerar e consultar relatórios clínicos',
    to: '/medical/reports',
    icon: FileText,
    keywords: ['relatorios', 'gerar', 'historico', 'pdf'],
  },
  {
    label: 'Meu perfil',
    description: 'Dados profissionais e identificação',
    to: '/medical/profile',
    icon: UserRound,
    keywords: ['perfil', 'medico', 'crm', 'especialidade', 'clinica'],
  },
  {
    label: 'Configurações',
    description: 'Alertas, notificações e segurança',
    to: '/medical/settings',
    icon: Cog,
    keywords: ['configuracoes', 'notificacoes', 'alertas', 'seguranca'],
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
    searchPlaceholder: 'Buscar paciente...',
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
  if (pathname.startsWith('/medical') || pathname.startsWith('/doctor')) {
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

/**
 * Single source of truth for deciding whether a navigation item represents
 * the current route. An item matches only its exact `to` path, unless it
 * explicitly declares `matchDescendants` (because it genuinely owns a
 * nested detail route) — in which case it also matches paths nested under
 * it. This is what keeps a dashboard/root item (e.g. `/app`, `/medical`)
 * from lighting up alongside every other item nested under the same first
 * path segment, without resorting to a generic `pathname.startsWith()`.
 *
 * Uses React Router's own `matchPath` so segment boundaries are respected
 * (e.g. `/medical/patients` never matches `/medical/patients-archive`).
 */
export function isNavigationItemActive(
  item: Pick<NavigationItem, 'to' | 'matchDescendants'>,
  pathname: string,
): boolean {
  return Boolean(
    matchPath({ path: item.to, end: !item.matchDescendants }, pathname),
  )
}

/**
 * Returns the single navigation item that represents the current route, or
 * `undefined` if none does. If more than one item's rule matches (which
 * should not normally happen given the exact-match default above), the
 * item with the most specific — i.e. longest — `to` path wins, so the
 * contract of "only one active item" always holds.
 */
export function getActiveNavigationItem<T extends NavigationItem>(
  items: T[],
  pathname: string,
): T | undefined {
  const matches = items.filter((item) => isNavigationItemActive(item, pathname))

  if (matches.length <= 1) {
    return matches[0]
  }

  return matches.reduce((mostSpecific, item) =>
    item.to.length > mostSpecific.to.length ? item : mostSpecific,
  )
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
