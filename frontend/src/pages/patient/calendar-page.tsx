import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'
import { calendarDays, calendarEvents } from '@/services/mock-data'

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const eventDays = new Set([10, 18, 24])

export function CalendarPage() {
  usePageTitle('Calendário')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Planejamento do cuidado"
        title="Calendário com visão delicada do seu mês"
        description="Centralize registros de sintomas, consultas e hábitos com uma leitura leve, clara e no ritmo da sua rotina."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Novo evento
          </Button>
        }
      />

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
        <div className="card-surface p-5">
          <div className="mb-5 flex items-center justify-between">
            <Button variant="secondary" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="section-label">Maio 2025</p>
              <h2 className="mt-1 text-xl font-semibold md:text-2xl">Calendário mensal</h2>
            </div>
            <Button variant="secondary" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center md:gap-2">
            {weekDays.map((day) => (
              <div key={day} className="py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => (
              <button
                key={`${day.day}-${index}`}
                type="button"
                className={`relative flex aspect-square items-center justify-center rounded-[1rem] text-sm transition ${
                  day.active
                    ? 'bg-brand-gradient text-white shadow-glow'
                    : day.muted
                      ? 'text-muted-foreground/40'
                      : 'bg-white/75 text-foreground hover:bg-brand-50'
                }`}
              >
                {day.day}
                {eventDays.has(day.day) && !day.active ? (
                  <span className="absolute bottom-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-surface p-5">
            <p className="section-label">24 de Maio</p>
            <h2 className="mt-2 text-xl font-semibold md:text-2xl">Agenda do dia</h2>
            <div className="mt-5 space-y-3">
              {calendarEvents.map((event) => (
                <div
                  key={`${event.time}-${event.title}`}
                  className="flex items-center gap-4 rounded-[1.2rem] border border-white/80 bg-white/84 px-4 py-3.5 shadow-soft"
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: event.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface p-5">
            <p className="section-label">Próximos marcos</p>
            <div className="mt-4 space-y-3">
              {[
                'Consulta com reumatologista em 27 de Maio',
                'Rotina de sono revisada em 29 de Maio',
                'Resumo clínico para exportação em 31 de Maio',
              ].map((item) => (
                <div key={item} className="rounded-[1.2rem] bg-brand-50/55 px-4 py-3.5 text-sm text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
