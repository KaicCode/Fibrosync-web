import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Save, Trash2, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { UsersTable } from '@/components/admin/tables/users-table'
import { AdminContentSection } from '@/components/admin/cards/content-section'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePageTitle } from '@/hooks/use-page-title'
import { adminService } from '@/services/admin.service'
import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  AdminUser,
} from '@/types/admin'

type UserFormState = {
  fullName: string
  email: string
  password: string
  role: 'USER' | 'ADMIN'
  birthDate: string
  gender: string
  heightCm: string
  weightKg: string
  countryCode: string
  timezone: string
  onboardingCompleted: boolean
}

function createEmptyUserForm(): UserFormState {
  return {
    fullName: '',
    email: '',
    password: '',
    role: 'USER',
    birthDate: '',
    gender: '',
    heightCm: '',
    weightKg: '',
    countryCode: '',
    timezone: 'America/Sao_Paulo',
    onboardingCompleted: false,
  }
}

function mapUserToForm(user: AdminUser): UserFormState {
  return {
    fullName: user.fullName,
    email: user.email,
    password: '',
    role: user.role,
    birthDate: user.birthDate ?? '',
    gender: user.gender ?? '',
    heightCm:
      typeof user.heightCm === 'number' ? String(user.heightCm) : '',
    weightKg:
      typeof user.weightKg === 'number' ? String(user.weightKg) : '',
    countryCode: user.countryCode ?? '',
    timezone: user.timezone,
    onboardingCompleted: user.onboardingCompleted,
  }
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function buildCreatePayload(form: UserFormState): AdminCreateUserInput {
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    password: form.password,
    role: form.role,
    birthDate: form.birthDate || undefined,
    gender: form.gender.trim() || undefined,
    heightCm: parseOptionalNumber(form.heightCm),
    weightKg: parseOptionalNumber(form.weightKg),
    countryCode: form.countryCode.trim() || undefined,
    timezone: form.timezone.trim() || undefined,
    onboardingCompleted: form.onboardingCompleted,
  }
}

function buildUpdatePayload(form: UserFormState): AdminUpdateUserInput {
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    password: form.password || undefined,
    role: form.role,
    birthDate: form.birthDate || null,
    gender: form.gender.trim() || null,
    heightCm: parseOptionalNumber(form.heightCm),
    weightKg: parseOptionalNumber(form.weightKg),
    countryCode: form.countryCode.trim() || null,
    timezone: form.timezone.trim() || undefined,
    onboardingCompleted: form.onboardingCompleted,
  }
}

export function AdminUsersPage() {
  usePageTitle('Gerenciar Usuários')

  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState<UserFormState>(() => createEmptyUserForm())
  const [feedback, setFeedback] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const usersQuery = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => adminService.getUsers({ page, limit: 10 }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: AdminCreateUserInput) => adminService.createUser(payload),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setFeedback('Conta criada com sucesso.')
      setSubmitError(null)
      setIsCreating(false)
      setSelectedUser(user)
      setForm(mapUserToForm(user))
    },
    onError: (error) => {
      setSubmitError(
        error instanceof Error ? error.message : 'Nao foi possivel criar a conta.',
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminUpdateUserInput }) =>
      adminService.updateUser(userId, payload),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setFeedback('Conta atualizada com sucesso.')
      setSubmitError(null)
      setSelectedUser(user)
      setForm(mapUserToForm(user))
    },
    onError: (error) => {
      setSubmitError(
        error instanceof Error ? error.message : 'Nao foi possivel atualizar a conta.',
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setFeedback('Conta removida com sucesso.')
      setSubmitError(null)
      setSelectedUser(null)
      setIsCreating(false)
      setForm(createEmptyUserForm())
    },
    onError: (error) => {
      setSubmitError(
        error instanceof Error ? error.message : 'Nao foi possivel remover a conta.',
      )
    },
  })

  const listData = usersQuery.data
  const users = listData?.items ?? []
  const selectedUserId = selectedUser?.id ?? null
  const activeMode = isCreating ? 'create' : selectedUser ? 'edit' : 'idle'

  function handleSelectUser(user: AdminUser) {
    setIsCreating(false)
    setSelectedUser(user)
    setForm(mapUserToForm(user))
    setSubmitError(null)
    setFeedback(null)
  }

  function handleStartCreate() {
    setIsCreating(true)
    setSelectedUser(null)
    setForm(createEmptyUserForm())
    setSubmitError(null)
    setFeedback(null)
  }

  async function handleSubmit() {
    setFeedback(null)
    setSubmitError(null)

    if (!form.fullName.trim() || !form.email.trim()) {
      setSubmitError('Preencha pelo menos nome e email.')
      return
    }

    if (isCreating && form.password.length < 8) {
      setSubmitError('A senha inicial precisa ter pelo menos 8 caracteres.')
      return
    }

    if (isCreating) {
      await createMutation.mutateAsync(buildCreatePayload(form))
      return
    }

    if (!selectedUser) {
      return
    }

    await updateMutation.mutateAsync({
      userId: selectedUser.id,
      payload: buildUpdatePayload(form),
    })
  }

  async function handleDelete() {
    if (!selectedUser) {
      return
    }

    const confirmed = window.confirm(
      `Deseja realmente excluir a conta de ${selectedUser.fullName}?`,
    )

    if (!confirmed) {
      return
    }

    await deleteMutation.mutateAsync(selectedUser.id)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gerenciamento"
        title="Usuários do sistema"
        description="Crie contas, ajuste perfis e remova acessos pela área administrativa."
        actions={
          <Button onClick={handleStartCreate}>
            <UserPlus className="h-4 w-4" />
            Novo usuario
          </Button>
        }
      />

      {feedback ? (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {submitError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.9fr)]">
        <AdminContentSection
          title="Lista de usuários"
          description={`Total atual: ${listData?.meta.total ?? 0} contas ativas`}
          isLoading={usersQuery.isLoading}
        >
          <UsersTable users={users} onSelectUser={handleSelectUser} />

          {listData && listData.meta.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {listData.meta.page} de {listData.meta.totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() =>
                  setPage((current) =>
                    Math.min(listData.meta.totalPages, current + 1),
                  )
                }
                disabled={page >= listData.meta.totalPages}
              >
                Proxima
              </Button>
            </div>
          ) : null}
        </AdminContentSection>

        <div className="card-surface space-y-5 p-6">
          {activeMode === 'idle' ? (
            <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <Plus className="h-8 w-8" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  Selecione um usuario ou crie uma conta
                </p>
                <p className="text-sm">
                  O painel lateral concentra criacao, edicao e remocao.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-label">
                    {isCreating ? 'Nova conta' : 'Edicao de conta'}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">
                    {isCreating
                      ? 'Criar usuario administrativo ou paciente'
                      : form.fullName || 'Atualizar usuario'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isCreating
                      ? 'Defina os dados iniciais e a funcao de acesso.'
                      : 'Ajuste perfil, funcao e dados cadastrais sem sair do admin.'}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedUser(null)
                    setIsCreating(false)
                    setForm(createEmptyUserForm())
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome completo</label>
                  <Input
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="Nome do usuario"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="email@fibrosync.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {isCreating ? 'Senha inicial' : 'Nova senha opcional'}
                  </label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder={isCreating ? 'Minimo de 8 caracteres' : 'Deixe vazio para manter'}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Funcao</label>
                  <select
                    value={form.role}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        role: event.target.value as 'USER' | 'ADMIN',
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="USER">Paciente</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nascimento</label>
                  <Input
                    type="date"
                    value={form.birthDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        birthDate: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Genero</label>
                  <Input
                    value={form.gender}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        gender: event.target.value,
                      }))
                    }
                    placeholder="Ex.: feminino"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Altura (cm)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.heightCm}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heightCm: event.target.value,
                      }))
                    }
                    placeholder="170"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Peso (kg)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.weightKg}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        weightKg: event.target.value,
                      }))
                    }
                    placeholder="70"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Pais</label>
                  <Input
                    value={form.countryCode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        countryCode: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="BR"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Timezone</label>
                  <Input
                    value={form.timezone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        timezone: event.target.value,
                      }))
                    }
                    placeholder="America/Sao_Paulo"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.onboardingCompleted}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      onboardingCompleted: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-input"
                />
                Marcar onboarding como concluido
              </label>

              {!isCreating && selectedUser ? (
                <div className="grid gap-3 rounded-[1.25rem] border border-white/70 bg-white/70 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span>Ultimo acesso</span>
                    <span className="font-medium text-foreground">
                      {selectedUser.lastLoginAt
                        ? new Date(selectedUser.lastLoginAt).toLocaleString('pt-BR')
                        : 'Sem acesso registrado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Criado em</span>
                    <span className="font-medium text-foreground">
                      {new Date(selectedUser.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => void handleSubmit()} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isCreating ? 'Criar conta' : 'Salvar alteracoes'}
                </Button>

                {!isCreating && selectedUserId ? (
                  <Button
                    variant="secondary"
                    onClick={() => void handleDelete()}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir conta
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
