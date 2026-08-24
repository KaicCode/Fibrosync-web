import { useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { usePageTitle } from '@/hooks/use-page-title'
import {
  doctorService,
  type DoctorPatientFilter,
  type DoctorPeriodDays,
} from '@/services/doctor.service'
import {
  formatMedicalDate,
  resolveFollowUpTone,
} from './medical-shared'

const filterOptions: Array<{
  value: DoctorPatientFilter
  label: string
}> = [
  { value: 'all', label: 'Todos' },
  { value: 'recent', label: 'Atualização recente' },
  { value: 'stale', label: 'Sem registro recente' },
  { value: 'incomplete', label: 'Perfil incompleto' },
]

export function MedicalPatientsPage() {
  usePageTitle('Meus pacientes')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<DoctorPatientFilter>('all')
  const deferredSearch = useDeferredValue(search)

  const patientsQuery = useQuery({
    queryKey: ['doctorPatients', deferredSearch, filter],
    queryFn: () =>
      doctorService.getPatients({
        search: deferredSearch.trim() || undefined,
        filter,
        periodDays: 30 as DoctorPeriodDays,
        page: 1,
        limit: 24,
      }),
  })

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Meus pacientes"
        title="Acompanhe apenas pacientes com vínculo ativo"
        description="A busca e os filtros abaixo consideram somente pacientes autorizados para acompanhamento clínico."
      />

      <div className="card-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar paciente..."
              className="h-12 rounded-[1.2rem] pl-11"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={filter === option.value ? 'default' : 'secondary'}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {patientsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : patientsQuery.isError || !patientsQuery.data ? (
        <div className="card-surface p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Não foi possível carregar estas informações
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tente novamente.
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => patientsQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : patientsQuery.data.items.length === 0 ? (
        <div className="card-surface p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <UsersRound className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Nenhum paciente vinculado
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Quando um paciente autorizar seu acompanhamento, ele aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {patientsQuery.data.items.map((patient) => (
            <div key={patient.patientId} className="card-surface p-5">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarFallback>
                    {patient.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-lg font-semibold text-foreground">
                      {patient.fullName}
                    </p>
                    <Badge variant={resolveFollowUpTone(patient.followUpStatus)}>
                      {patient.followUpLabel}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {patient.lastRecordAt
                      ? `Último registro: ${formatMedicalDate(patient.lastRecordAt)}`
                      : 'Sem registros recentes'}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1rem] border border-white/80 bg-white/78 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Registros recentes
                      </p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {patient.recentRecordCount}
                      </p>
                    </div>
                    <div className="rounded-[1rem] border border-white/80 bg-white/78 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Dor recente
                      </p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {patient.latestPainLevel !== null
                          ? `${patient.latestPainLevel}/10`
                          : '--'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button asChild>
                  <Link to={`/medical/patients/${patient.patientId}`}>
                    Ver acompanhamento
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
