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
import { toast } from '@/store/toast-store'
import type { ApiUserRole } from '@/lib/user-role'
import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  AdminUser,
} from '@/types/admin'

type UserFormState = {
  fullName: string
  email: string
  password: string
  role: ApiUserRole
  birthDate: string
  gender: string
  heightCm: string
  weightKg: string
  countryCode: string
  timezone: string
  specialty: string
  professionalCouncilType: string
  professionalCouncilNumber: string
  professionalCouncilState: string
  professionalPhone: string
  onboardingCompleted: boolean
}

type FieldErrors = Partial<Record<keyof UserFormState, string>>

const DEFAULT_TIMEZONE = 'America/Sao_Paulo'

function createEmptyUserForm(role: ApiUserRole = 'USER'): UserFormState {
  return sanitizeFormForRole(
    {
      fullName: '',
      email: '',
      password: '',
      role,
      birthDate: '',
      gender: '',
      heightCm: '',
      weightKg: '',
      countryCode: '',
      timezone: DEFAULT_TIMEZONE,
      specialty: '',
      professionalCouncilType: '',
      professionalCouncilNumber: '',
      professionalCouncilState: '',
      professionalPhone: '',
      onboardingCompleted: false,
    },
    role,
  )
}

function sanitizeFormForRole(
  form: UserFormState,
  role: ApiUserRole,
): UserFormState {
  const nextForm: UserFormState = {
    ...form,
    role,
  }

  if (role === 'USER') {
    return {
      ...nextForm,
      timezone: nextForm.timezone || DEFAULT_TIMEZONE,
      specialty: '',
      professionalCouncilType: '',
      professionalCouncilNumber: '',
      professionalCouncilState: '',
      professionalPhone: '',
    }
  }

  if (role === 'MEDICAL') {
    return {
      ...nextForm,
      birthDate: '',
      gender: '',
      heightCm: '',
      weightKg: '',
      timezone: nextForm.timezone || DEFAULT_TIMEZONE,
    }
  }

  return {
    ...nextForm,
    birthDate: '',
    gender: '',
    heightCm: '',
    weightKg: '',
    countryCode: '',
    timezone: '',
    specialty: '',
    professionalCouncilType: '',
    professionalCouncilNumber: '',
    professionalCouncilState: '',
    professionalPhone: '',
    onboardingCompleted: false,
  }
}

function mapUserToForm(user: AdminUser): UserFormState {
  return sanitizeFormForRole(
    {
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
      timezone: user.timezone ?? DEFAULT_TIMEZONE,
      specialty: user.specialty ?? '',
      professionalCouncilType: user.professionalCouncilType ?? '',
      professionalCouncilNumber: user.professionalCouncilNumber ?? '',
      professionalCouncilState: user.professionalCouncilState ?? '',
      professionalPhone: user.professionalPhone ?? '',
      onboardingCompleted: user.onboardingCompleted,
    },
    user.role,
  )
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function buildCreatePayload(form: UserFormState): AdminCreateUserInput {
  const basePayload: AdminCreateUserInput = {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    password: form.password,
    role: form.role,
  }

  if (form.role === 'USER') {
    return {
      ...basePayload,
      birthDate: form.birthDate || undefined,
      gender: form.gender.trim() || undefined,
      heightCm: parseOptionalNumber(form.heightCm),
      weightKg: parseOptionalNumber(form.weightKg),
      countryCode: form.countryCode.trim() || undefined,
      timezone: form.timezone.trim() || undefined,
      onboardingCompleted: form.onboardingCompleted,
    }
  }

  if (form.role === 'MEDICAL') {
    return {
      ...basePayload,
      countryCode: form.countryCode.trim() || undefined,
      timezone: form.timezone.trim() || undefined,
      specialty: form.specialty.trim() || undefined,
      professionalCouncilType: form.professionalCouncilType.trim() || undefined,
      professionalCouncilNumber: form.professionalCouncilNumber.trim() || undefined,
      professionalCouncilState: form.professionalCouncilState.trim() || undefined,
      professionalPhone: form.professionalPhone.trim() || undefined,
      onboardingCompleted: form.onboardingCompleted,
    }
  }

  return basePayload
}

function buildUpdatePayload(form: UserFormState): AdminUpdateUserInput {
  const basePayload: AdminUpdateUserInput = {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    password: form.password || undefined,
    role: form.role,
  }

  if (form.role === 'USER') {
    return {
      ...basePayload,
      birthDate: form.birthDate || null,
      gender: form.gender.trim() || null,
      heightCm: parseOptionalNumber(form.heightCm),
      weightKg: parseOptionalNumber(form.weightKg),
      countryCode: form.countryCode.trim() || null,
      timezone: form.timezone.trim() || undefined,
      onboardingCompleted: form.onboardingCompleted,
    }
  }

  if (form.role === 'MEDICAL') {
    return {
      ...basePayload,
      countryCode: form.countryCode.trim() || null,
      timezone: form.timezone.trim() || undefined,
      specialty: form.specialty.trim() || null,
      professionalCouncilType: form.professionalCouncilType.trim() || null,
      professionalCouncilNumber: form.professionalCouncilNumber.trim() || null,
      professionalCouncilState: form.professionalCouncilState.trim() || null,
      professionalPhone: form.professionalPhone.trim() || null,
      onboardingCompleted: form.onboardingCompleted,
    }
  }

  return basePayload
}

function validateForm(
  form: UserFormState,
  isCreating: boolean,
): FieldErrors {
  const errors: FieldErrors = {}
  const normalizedEmail = form.email.trim()

  if (!form.fullName.trim()) {
    errors.fullName = 'Informe o nome completo.'
  }

  if (!normalizedEmail) {
    errors.email = 'Informe o e-mail.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'Use um e-mail valido.'
  }

  if (isCreating && form.password.length < 8) {
    errors.password = 'A credencial inicial precisa ter pelo menos 8 caracteres.'
  }

  if (form.role !== 'ADMIN' && !form.timezone.trim()) {
    errors.timezone = 'Informe o fuso horario.'
  }

  if (form.role === 'MEDICAL') {
    if (!form.specialty.trim()) {
      errors.specialty = 'Informe a especialidade.'
    }

    if (!form.professionalCouncilType.trim()) {
      errors.professionalCouncilType = 'Informe o conselho profissional.'
    }

    if (!form.professionalCouncilNumber.trim()) {
      errors.professionalCouncilNumber = 'Informe o numero do registro.'
    }

    if (!form.professionalCouncilState.trim()) {
      errors.professionalCouncilState = 'Informe a UF do conselho.'
    }
  }

  return errors
}

function resolveCreateSuccessMessage(role: ApiUserRole): {
  title: string
  description: string
} {
  if (role === 'ADMIN') {
    return {
      title: 'Conta criada com sucesso',
      description: 'A conta administrativa foi criada.',
    }
  }

  if (role === 'MEDICAL') {
    return {
      title: 'Conta criada com sucesso',
      description:
        'A conta do profissional foi criada. Ele podera completar o perfil no primeiro acesso.',
    }
  }

  return {
    title: 'Conta criada com sucesso',
    description:
      'A conta do paciente ja pode ser acessada com as credenciais iniciais.',
  }
}

function resolveSaveButtonLabel(isCreating: boolean, isSaving: boolean): string {
  if (isCreating) {
    return isSaving ? 'Criando conta...' : 'Criar conta'
  }

  return isSaving ? 'Salvando...' : 'Salvar alteracoes'
}

function resolveSubmitError(error: unknown, isCreating: boolean): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return isCreating
    ? 'Nao foi possivel criar a conta. Verifique as informacoes e tente novamente.'
    : 'Nao foi possivel atualizar a conta. Verifique as informacoes e tente novamente.'
}

function mapServerErrorToFields(message: string): FieldErrors {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('e-mail')) {
    return {
      email: message,
    }
  }

  if (normalizedMessage.includes('registro')) {
    return {
      professionalCouncilNumber: message,
    }
  }

  return {}
}

function FieldErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-xs text-rose-600">{message}</p>
}

export function AdminUsersPage() {
  usePageTitle('Gerenciar Usuarios')

  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState<UserFormState>(() => createEmptyUserForm())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const usersQuery = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => adminService.getUsers({ page, limit: 10 }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: AdminCreateUserInput) => adminService.createUser(payload),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setSubmitError(null)
      setFieldErrors({})
      setIsCreating(false)
      setSelectedUser(user)
      setForm(mapUserToForm(user))

      const feedback = resolveCreateSuccessMessage(user.role)
      toast.success(feedback.title, feedback.description)
    },
    onError: (error) => {
      const message = resolveSubmitError(error, true)
      const mappedFieldErrors = mapServerErrorToFields(message)

      setFieldErrors((current) => ({ ...current, ...mappedFieldErrors }))
      setSubmitError(message)
      toast.error('Nao foi possivel criar a conta', message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminUpdateUserInput }) =>
      adminService.updateUser(userId, payload),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setSubmitError(null)
      setFieldErrors({})
      setSelectedUser(user)
      setForm(mapUserToForm(user))
      toast.success('Conta atualizada com sucesso', 'Os dados da conta foram salvos.')
    },
    onError: (error) => {
      const message = resolveSubmitError(error, false)
      const mappedFieldErrors = mapServerErrorToFields(message)

      setFieldErrors((current) => ({ ...current, ...mappedFieldErrors }))
      setSubmitError(message)
      toast.error('Nao foi possivel atualizar a conta', message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setSubmitError(null)
      setFieldErrors({})
      setSelectedUser(null)
      setIsCreating(false)
      setForm(createEmptyUserForm())
      toast.success('Conta removida com sucesso', 'O acesso foi desativado na plataforma.')
    },
    onError: (error) => {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Nao foi possivel remover a conta.'

      setSubmitError(message)
      toast.error('Nao foi possivel remover a conta', message)
    },
  })

  const listData = usersQuery.data
  const users = listData?.items ?? []
  const selectedUserId = selectedUser?.id ?? null
  const activeMode = isCreating ? 'create' : selectedUser ? 'edit' : 'idle'
  const isSaving = createMutation.isPending || updateMutation.isPending

  const showPatientFields = form.role === 'USER'
  const showMedicalFields = form.role === 'MEDICAL'
  const showTimezoneFields = form.role !== 'ADMIN'
  const showOnboardingToggle = form.role !== 'ADMIN'

  function updateFormField<Key extends keyof UserFormState>(
    key: Key,
    value: UserFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))

    setFieldErrors((current) => {
      if (!current[key]) {
        return current
      }

      const nextErrors = { ...current }
      delete nextErrors[key]
      return nextErrors
    })
  }

  function handleRoleChange(nextRole: ApiUserRole) {
    setForm((current) => sanitizeFormForRole(current, nextRole))
    setFieldErrors({})
    setSubmitError(null)
  }

  function handleSelectUser(user: AdminUser) {
    setIsCreating(false)
    setSelectedUser(user)
    setForm(mapUserToForm(user))
    setFieldErrors({})
    setSubmitError(null)
  }

  function handleStartCreate() {
    setIsCreating(true)
    setSelectedUser(null)
    setForm(createEmptyUserForm())
    setFieldErrors({})
    setSubmitError(null)
  }

  async function handleSubmit() {
    setSubmitError(null)

    const nextErrors = validateForm(form, isCreating)

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      toast.error(
        'Verifique as informacoes',
        'Alguns campos precisam ser revisados antes de continuar.',
      )
      return
    }

    setFieldErrors({})

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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gerenciamento"
        title="Usuarios do sistema"
        description="Crie contas de paciente, medico e administrador no mesmo fluxo administrativo."
        actions={
          <Button onClick={handleStartCreate}>
            <UserPlus className="h-4 w-4" />
            Nova conta
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(23rem,0.95fr)]">
        <AdminContentSection
          title="Lista de usuarios"
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
                  Selecione uma conta ou crie um novo acesso
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
                    {isCreating ? 'Defina os dados iniciais' : form.fullName || 'Atualizar conta'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isCreating
                      ? 'Defina os dados iniciais e o tipo de acesso do usuario.'
                      : 'Atualize os dados iniciais e o tipo de acesso da conta.'}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedUser(null)
                    setIsCreating(false)
                    setForm(createEmptyUserForm())
                    setFieldErrors({})
                    setSubmitError(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {submitError ? (
                <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {submitError}
                </div>
              ) : null}

              <div className="space-y-5">
                <section className="space-y-4">
                  <div className="space-y-1">
                    <p className="section-label">Tipo de conta</p>
                    <p className="text-sm text-muted-foreground">
                      Escolha se o novo acesso sera de paciente, medico ou administrador.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Tipo de conta
                    </label>
                    <select
                      value={form.role}
                      onChange={(event) =>
                        handleRoleChange(event.target.value as ApiUserRole)
                      }
                      className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                    >
                      <option value="USER">Paciente</option>
                      <option value="MEDICAL">Medico</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="space-y-1">
                    <p className="section-label">
                      {showPatientFields ? 'Dados pessoais' : 'Dados basicos'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {showPatientFields
                        ? 'Informacoes iniciais da conta do paciente.'
                        : showMedicalFields
                          ? 'Informacoes iniciais da conta profissional.'
                          : 'Somente o necessario para a conta administrativa.'}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-foreground">
                        Nome completo
                      </label>
                      <Input
                        value={form.fullName}
                        onChange={(event) =>
                          updateFormField('fullName', event.target.value)
                        }
                        placeholder="Nome do usuario"
                      />
                      <FieldErrorMessage message={fieldErrors.fullName} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        E-mail
                      </label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          updateFormField('email', event.target.value)
                        }
                        placeholder="email@fibrosync.com"
                      />
                      <FieldErrorMessage message={fieldErrors.email} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {isCreating ? 'Acesso inicial' : 'Novo acesso inicial'}
                      </label>
                      <Input
                        type="password"
                        value={form.password}
                        onChange={(event) =>
                          updateFormField('password', event.target.value)
                        }
                        placeholder={
                          isCreating
                            ? 'Minimo de 8 caracteres'
                            : 'Deixe vazio para manter'
                        }
                      />
                      <FieldErrorMessage message={fieldErrors.password} />
                    </div>

                    {showPatientFields ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            Nascimento
                          </label>
                          <Input
                            type="date"
                            value={form.birthDate}
                            onChange={(event) =>
                              updateFormField('birthDate', event.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            Genero
                          </label>
                          <Input
                            value={form.gender}
                            onChange={(event) =>
                              updateFormField('gender', event.target.value)
                            }
                            placeholder="Ex.: feminino"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            Altura (cm)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={form.heightCm}
                            onChange={(event) =>
                              updateFormField('heightCm', event.target.value)
                            }
                            placeholder="170"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            Peso (kg)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={form.weightKg}
                            onChange={(event) =>
                              updateFormField('weightKg', event.target.value)
                            }
                            placeholder="70"
                          />
                        </div>
                      </>
                    ) : null}

                    {showTimezoneFields ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            Pais
                          </label>
                          <Input
                            value={form.countryCode}
                            onChange={(event) =>
                              updateFormField(
                                'countryCode',
                                event.target.value.toUpperCase(),
                              )
                            }
                            placeholder="BR"
                            maxLength={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            Fuso horario
                          </label>
                          <Input
                            value={form.timezone}
                            onChange={(event) =>
                              updateFormField('timezone', event.target.value)
                            }
                            placeholder="America/Sao_Paulo"
                          />
                          <FieldErrorMessage message={fieldErrors.timezone} />
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>

                {showMedicalFields ? (
                  <section className="space-y-4">
                    <div className="space-y-1">
                      <p className="section-label">Dados profissionais</p>
                      <p className="text-sm text-muted-foreground">
                        Campos minimos para identificar o profissional de saude.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-foreground">
                          Especialidade
                        </label>
                        <Input
                          value={form.specialty}
                          onChange={(event) =>
                            updateFormField('specialty', event.target.value)
                          }
                          placeholder="Ex.: Reumatologia"
                        />
                        <FieldErrorMessage message={fieldErrors.specialty} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Conselho profissional
                        </label>
                        <Input
                          value={form.professionalCouncilType}
                          onChange={(event) =>
                            updateFormField(
                              'professionalCouncilType',
                              event.target.value.toUpperCase(),
                            )
                          }
                          placeholder="CRM"
                        />
                        <FieldErrorMessage
                          message={fieldErrors.professionalCouncilType}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Numero do registro
                        </label>
                        <Input
                          value={form.professionalCouncilNumber}
                          onChange={(event) =>
                            updateFormField(
                              'professionalCouncilNumber',
                              event.target.value,
                            )
                          }
                          placeholder="123456"
                        />
                        <FieldErrorMessage
                          message={fieldErrors.professionalCouncilNumber}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          UF do conselho
                        </label>
                        <Input
                          value={form.professionalCouncilState}
                          onChange={(event) =>
                            updateFormField(
                              'professionalCouncilState',
                              event.target.value.toUpperCase(),
                            )
                          }
                          placeholder="PI"
                          maxLength={2}
                        />
                        <FieldErrorMessage
                          message={fieldErrors.professionalCouncilState}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Telefone profissional
                        </label>
                        <Input
                          value={form.professionalPhone}
                          onChange={(event) =>
                            updateFormField(
                              'professionalPhone',
                              event.target.value,
                            )
                          }
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                  </section>
                ) : null}

                {showOnboardingToggle ? (
                  <section className="space-y-3">
                    <div className="space-y-1">
                      <p className="section-label">Configuracao inicial</p>
                      <p className="text-sm text-muted-foreground">
                        Use apenas quando o perfil ja estiver configurado.
                      </p>
                    </div>

                    <label className="flex items-start gap-3 rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={form.onboardingCompleted}
                        onChange={(event) =>
                          updateFormField(
                            'onboardingCompleted',
                            event.target.checked,
                          )
                        }
                        className="mt-0.5 h-4 w-4 rounded border-input"
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          Pular configuracao inicial
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          Use apenas se as principais informacoes do usuario ja
                          estiverem configuradas.
                        </p>
                      </div>
                    </label>
                  </section>
                ) : null}

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
                    {resolveSaveButtonLabel(isCreating, isSaving)}
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
