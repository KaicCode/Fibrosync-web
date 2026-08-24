import { useState } from 'react'
import type { ReactNode } from 'react'
import { Building2, Mail, Phone, Save, ShieldCheck, Stethoscope } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { usePageTitle } from '@/hooks/use-page-title'
import { useUser } from '@/hooks/useUser'
import { resolveAccountStatusLabel, resolveRoleLabel } from '@/lib/user-role'
import { toast } from '@/store/toast-store'
import { formatMedicalDateTime } from './medical-shared'

type ProfileFormState = {
  fullName: string
  specialty: string
  professionalCouncilType: string
  professionalCouncilNumber: string
  professionalCouncilState: string
  professionalPhone: string
  professionalClinic: string
  timezone: string
  professionalBio: string
}

function buildProfileFormState(
  user:
    | {
        fullName: string
        specialty?: string | null
        professionalCouncilType?: string | null
        professionalCouncilNumber?: string | null
        professionalCouncilState?: string | null
        professionalPhone?: string | null
        professionalClinic?: string | null
        timezone: string
        professionalBio?: string | null
      }
    | null
    | undefined,
): ProfileFormState {
  return {
    fullName: user?.fullName ?? '',
    specialty: user?.specialty ?? '',
    professionalCouncilType: user?.professionalCouncilType ?? '',
    professionalCouncilNumber: user?.professionalCouncilNumber ?? '',
    professionalCouncilState: user?.professionalCouncilState ?? '',
    professionalPhone: user?.professionalPhone ?? '',
    professionalClinic: user?.professionalClinic ?? '',
    timezone: user?.timezone ?? 'America/Sao_Paulo',
    professionalBio: user?.professionalBio ?? '',
  }
}

export function MedicalProfilePage() {
  usePageTitle('Meu perfil médico')

  const { user, isLoading, updateProfile, isUpdating } = useUser()
  const [draft, setDraft] = useState<Partial<ProfileFormState>>({})
  const form = {
    ...buildProfileFormState(user),
    ...draft,
  }

  async function handleSubmit() {
    try {
      await updateProfile({
        fullName: form.fullName.trim(),
        specialty: form.specialty.trim() || null,
        professionalCouncilType: form.professionalCouncilType.trim() || null,
        professionalCouncilNumber: form.professionalCouncilNumber.trim() || null,
        professionalCouncilState: form.professionalCouncilState.trim() || null,
        professionalPhone: form.professionalPhone.trim() || null,
        professionalClinic: form.professionalClinic.trim() || null,
        timezone: form.timezone.trim() || 'America/Sao_Paulo',
        professionalBio: form.professionalBio.trim() || null,
      })
      setDraft({})

      toast.success(
        'Perfil atualizado',
        'Suas informações profissionais foram salvas.',
      )
    } catch {
      toast.error(
        'Não foi possível salvar o perfil',
        'Revise os dados informados e tente novamente.',
      )
    }
  }

  if (isLoading && !user) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-[32rem] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Meu perfil"
        title="Dados profissionais do acompanhamento"
        description="Mantenha sua identificação profissional atualizada para o uso clínico do FibroSync."
        actions={
          <Button onClick={() => void handleSubmit()} disabled={isUpdating}>
            <Save className="h-4 w-4" />
            {isUpdating ? 'Salvando...' : 'Salvar perfil'}
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_22rem]">
        <div className="card-surface p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome completo">
              <Input
                value={form.fullName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Seu nome profissional"
              />
            </Field>

            <Field label="Especialidade">
              <Input
                value={form.specialty}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    specialty: event.target.value,
                  }))
                }
                placeholder="Ex.: Reumatologia"
              />
            </Field>

            <Field label="Conselho profissional">
              <Input
                value={form.professionalCouncilType}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    professionalCouncilType: event.target.value,
                  }))
                }
                placeholder="Ex.: CRM"
              />
            </Field>

            <Field label="Número do conselho">
              <Input
                value={form.professionalCouncilNumber}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    professionalCouncilNumber: event.target.value,
                  }))
                }
                placeholder="Ex.: 123456"
              />
            </Field>

            <Field label="UF do conselho">
              <Input
                value={form.professionalCouncilState}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    professionalCouncilState: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="Ex.: SP"
                maxLength={2}
              />
            </Field>

            <Field label="Telefone profissional">
              <Input
                value={form.professionalPhone}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    professionalPhone: event.target.value,
                  }))
                }
                placeholder="(00) 00000-0000"
              />
            </Field>

            <Field label="Clínica ou instituição">
              <Input
                value={form.professionalClinic}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    professionalClinic: event.target.value,
                  }))
                }
                placeholder="Local principal de atuação"
              />
            </Field>

            <Field label="Fuso horário">
              <Input
                value={form.timezone}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    timezone: event.target.value,
                  }))
                }
                placeholder="America/Sao_Paulo"
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Resumo profissional">
              <Textarea
                value={form.professionalBio}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    professionalBio: event.target.value,
                  }))
                }
                placeholder="Descreva sua atuação clínica de forma breve."
                className="min-h-36"
              />
            </Field>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-surface p-5">
            <p className="section-label">Identificação</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              {user?.fullName ?? 'Profissional'}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="default">{resolveRoleLabel(user?.role)}</Badge>
              <Badge variant="neutral">
                {resolveAccountStatusLabel(user?.accountStatus)}
              </Badge>
            </div>

            <div className="mt-5 space-y-3">
              <InfoRow
                icon={Stethoscope}
                label="Especialidade"
                value={user?.specialty ?? 'Não informada'}
              />
              <InfoRow
                icon={ShieldCheck}
                label="Conselho"
                value={
                  user?.professionalCouncilType && user.professionalCouncilNumber
                    ? `${user.professionalCouncilType} ${user.professionalCouncilNumber}${user.professionalCouncilState ? ` · ${user.professionalCouncilState}` : ''}`
                    : 'Não informado'
                }
              />
              <InfoRow
                icon={Building2}
                label="Clínica"
                value={user?.professionalClinic ?? 'Não informada'}
              />
              <InfoRow
                icon={Phone}
                label="Telefone"
                value={user?.professionalPhone ?? 'Não informado'}
              />
              <InfoRow
                icon={Mail}
                label="E-mail"
                value={user?.email ?? 'Não informado'}
              />
            </div>
          </div>

          <div className="card-surface p-5">
            <p className="section-label">Última atividade</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {user?.lastLoginAt
                ? `Último acesso em ${formatMedicalDateTime(user.lastLoginAt)}.`
                : 'Sem registro recente de acesso.'}
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              As informações deste perfil são usadas apenas para identificação
              profissional dentro do módulo clínico.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="space-y-2">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {children}
    </label>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1rem] border border-white/80 bg-white/82 px-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <p className="text-xs uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
