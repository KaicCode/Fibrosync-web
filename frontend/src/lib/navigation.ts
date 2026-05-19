import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
  HeartPulse,
  LayoutDashboard,
  MessageCircleHeart,
  ShieldPlus,
  Sparkles,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import type { AppRole } from '@/store/app-store'

export type WorkspaceVariant = AppRole

export type NavigationItem = {
  label: string
  to: string
  icon: LucideIcon
}

export const patientNavigation: NavigationItem[] = [
  { label: 'Resumo', to: '/app', icon: LayoutDashboard },
  { label: 'Registro de dor', to: '/app/pain-log', icon: HeartPulse },
  { label: 'Relatórios', to: '/app/reports', icon: BarChart3 },
  { label: 'Assistente IA', to: '/app/assistant', icon: Sparkles },
  { label: 'Calendário', to: '/app/calendar', icon: CalendarDays },
  { label: 'Comunidade', to: '/app/community', icon: MessageCircleHeart },
  { label: 'Perfil', to: '/app/profile', icon: UserRound },
]

export const medicalNavigation: NavigationItem[] = [
  { label: 'Painel médico', to: '/medical', icon: Stethoscope },
]

export const adminNavigation: NavigationItem[] = [
  { label: 'Visão geral', to: '/admin', icon: ShieldPlus },
]

export const workspaceConfig = {
  patient: {
    label: 'Experiência do paciente',
    shortLabel: 'Paciente',
    navigation: patientNavigation,
    searchPlaceholder: 'Buscar insights, sintomas ou lembretes...',
  },
  medical: {
    label: 'Painel clínico',
    shortLabel: 'Médico',
    navigation: medicalNavigation,
    searchPlaceholder: 'Buscar pacientes, sintomas ou evolução...',
  },
  admin: {
    label: 'Administração',
    shortLabel: 'Admin',
    navigation: adminNavigation,
    searchPlaceholder: 'Buscar métricas, usuários ou relatórios...',
  },
} satisfies Record<
  WorkspaceVariant,
  {
    label: string
    shortLabel: string
    navigation: NavigationItem[]
    searchPlaceholder: string
  }
>

export const roleOptions: Array<{
  role: WorkspaceVariant
  label: string
  href: string
}> = [
  { role: 'patient', label: 'Paciente', href: '/app' },
  { role: 'medical', label: 'Médico', href: '/medical' },
  { role: 'admin', label: 'Admin', href: '/admin' },
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
