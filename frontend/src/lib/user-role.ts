export type ApiUserRole = 'USER' | 'MEDICAL' | 'ADMIN'

export type WorkspaceRole = 'patient' | 'medical' | 'admin'

export type AccountStatus = 'PENDING_PROFILE' | 'ACTIVE' | 'SUSPENDED'

export function resolveWorkspaceRole(role?: string | null): WorkspaceRole {
  if (role === 'ADMIN') {
    return 'admin'
  }

  if (role === 'MEDICAL') {
    return 'medical'
  }

  return 'patient'
}

export function resolveHomePathByRole(role?: string | null): string {
  if (role === 'ADMIN') {
    return '/admin/dashboard'
  }

  if (role === 'MEDICAL') {
    return '/medical'
  }

  return '/app'
}

export function resolveRoleLabel(role?: string | null): string {
  if (role === 'ADMIN') {
    return 'Administrador'
  }

  if (role === 'MEDICAL') {
    return 'Medico'
  }

  return 'Paciente'
}

export function canAccessPatientWorkspace(role?: string | null): boolean {
  return role === 'USER' || role === 'ADMIN'
}

export function canAccessMedicalWorkspace(role?: string | null): boolean {
  return role === 'MEDICAL' || role === 'ADMIN'
}

export function canAccessAdminWorkspace(role?: string | null): boolean {
  return role === 'ADMIN'
}

export function resolveAccountStatusLabel(status?: string | null): string {
  if (status === 'SUSPENDED') {
    return 'Suspensa'
  }

  if (status === 'PENDING_PROFILE') {
    return 'Perfil pendente'
  }

  return 'Ativa'
}
