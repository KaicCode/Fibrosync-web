import type { LucideIcon } from 'lucide-react'
import {
  BellRing,
  ChevronRight,
  MoonStar,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'

const settingsHighlights: Array<{
  title: string
  description: string
  badge: string
  icon: LucideIcon
}> = [
  {
    title: 'Experiência inteligente',
    description: 'Escolha como a IA organiza resumos, alertas e recomendações do seu cuidado.',
    badge: 'Auto',
    icon: Sparkles,
  },
  {
    title: 'Notificações delicadas',
    description: 'Controle frequência, horário silencioso e lembretes de registro com elegância.',
    badge: 'Ativo',
    icon: BellRing,
  },
  {
    title: 'Aparência adaptativa',
    description: 'Interface preparada para ambientes claros e escuros com contraste confortável.',
    badge: 'Dinâmico',
    icon: MoonStar,
  },
]

const workspacePreferences = [
  'Resumo matinal diário às 8h00',
  'Alertas sutis para registro no fim do dia',
  'Busca inteligente com histórico recente',
  'Sugestões de rotina baseadas no calendário',
]

const privacyControls = [
  'Compartilhamento clínico controlado por sessão',
  'Exportação de relatórios somente com confirmação',
  'Proteção reforçada para dispositivos conectados',
  'Revisão periódica de permissões de acesso',
]

export function SettingsPage() {
  usePageTitle('Configurações')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Preferências do workspace"
        title="Ajuste sua experiência premium com clareza"
        description="Organize alertas, aparência, privacidade e automações em uma central pensada para manter foco, confiança e continuidade no cuidado."
        actions={
          <Button variant="secondary">
            <SlidersHorizontal className="h-4 w-4" />
            Personalizar fluxo
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {settingsHighlights.map((item) => (
          <div key={item.title} className="card-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                <item.icon className="h-5 w-5" />
              </div>
              <Badge>{item.badge}</Badge>
            </div>
            <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Workspace</p>
              <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                Preferências rápidas
              </h2>
            </div>
            <Button variant="outline" size="sm">
              Editar
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {workspacePreferences.map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-white/80 bg-white/84 px-4 py-3.5 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    {index % 2 === 0 ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <Smartphone className="h-4 w-4" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{item}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-label">Privacidade</p>
              <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                Segurança e controle
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {privacyControls.map((item) => (
              <div
                key={item}
                className="rounded-[1.25rem] border border-white/80 bg-brand-50/55 px-4 py-3.5"
              >
                <p className="text-sm font-medium text-foreground">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[1.3rem] border border-white/80 bg-white/86 p-4 shadow-soft">
            <p className="text-sm font-semibold text-foreground">Proteção sincronizada</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Suas preferências acompanham o workspace para manter a mesma experiência em consultas, rotina e acompanhamento remoto.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
