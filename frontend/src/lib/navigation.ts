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
}

export const patientNavigation: NavigationItem[] = [
  { label: 'Resumo', description: 'Visão geral do dia', to: '/app', icon: LayoutDashboard },
  {
    label: 'Registro de dor',
    description: 'Capture sintomas e gatilhos',
    to: '/app/pain-log',
    icon: HeartPulse,
  },
  {
    label: 'Relatórios',
    description: 'Tendências, comparativos e exportações',
    to: '/app/reports',
    icon: BarChart3,
  },
  {
    label: 'Assistente IA',
    description: 'Insights e orientação contextual',
    to: '/app/assistant',
    icon: Sparkles,
    badge: 'Novo',
  },
  {
    label: 'Calendário',
    description: 'Rotina, lembretes e próximos eventos',
    to: '/app/calendar',
    icon: CalendarDays,
  },
  {
    label: 'Comunidade',
    description: 'Trocas seguras com outras pessoas',
    to: '/app/community',
    icon: MessageCircleHeart,
  },
  { label: 'Perfil', description: 'Metas, evolução e conquistas', to: '/app/profile', icon: UserRound },
  {
    label: 'Configurações',
    description: 'Preferências, alertas e privacidade',
    to: '/app/settings',
    icon: Cog,
  },
]

export const medicalNavigation: NavigationItem[] = [
  {
    label: 'Painel médico',
    description: 'Acompanhe pacientes, sinais e evolução',
    to: '/medical',
    icon: Stethoscope,
  },
]

export const adminNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    description: 'Métricas e alertas do sistema',
    to: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Usuários',
    description: 'Gerenciar usuários da plataforma',
    to: '/admin/users',
    icon: Users,
  },
  {
    label: 'Relatórios',
    description: 'Gerar e exportar dados',
    to: '/admin/reports',
    icon: FileText,
  },
  {
    label: 'Análiticos',
    description: 'Padrões, gatilhos e correlações',
    to: '/admin/analytics',
    icon: TrendingUp,
  },
  {
    label: 'Configurações',
    description: 'IA, notificações e limites de risco',
    to: '/admin/settings',
    icon: Cog,
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
