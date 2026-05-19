import { useState } from 'react'
import { HeartPulse, Save, Sparkles } from 'lucide-react'
import { BodyMap } from '@/components/body-map'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { usePageTitle } from '@/hooks/use-page-title'
import { bodyPointLabels, painTriggers, painTypes } from '@/services/mock-data'
import { useAppStore } from '@/store/app-store'

export function PainLogPage() {
  usePageTitle('Registro de Dor')

  const painDraft = useAppStore((state) => state.painDraft)
  const updatePainDraft = useAppStore((state) => state.updatePainDraft)
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(['Estresse', 'Clima frio'])

  const togglePoint = (point: keyof typeof bodyPointLabels) => {
    const selected = painDraft.selectedPoints.includes(point)
    updatePainDraft({
      selectedPoints: selected
        ? painDraft.selectedPoints.filter((item) => item !== point)
        : [...painDraft.selectedPoints, point],
    })
  }

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((current) =>
      current.includes(trigger) ? current.filter((item) => item !== trigger) : [...current, trigger],
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registro diário"
        title="Mapeie o seu corpo com precisão gentil"
        description="Selecione áreas de dor, intensidade e gatilhos percebidos para construir um histórico mais inteligente."
        actions={<Badge variant="default">Hoje, 24 de Maio</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="card-surface p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="section-label">Mapa corporal</p>
              <h2 className="mt-2 text-2xl font-semibold">Onde a dor está presente?</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <HeartPulse className="h-5 w-5" />
            </div>
          </div>
          <BodyMap
            selectedPoints={painDraft.selectedPoints}
            onTogglePoint={togglePoint}
          />
          <div className="mt-5 flex flex-wrap gap-2">
            {painDraft.selectedPoints.map((point) => (
              <Badge key={point}>{bodyPointLabels[point as keyof typeof bodyPointLabels]}</Badge>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="section-label">Intensidade</p>
                <h2 className="mt-2 text-2xl font-semibold">Nível atual da dor</h2>
              </div>
              <p className="text-3xl font-semibold tracking-[-0.06em] text-brand-700">
                {painDraft.intensity}
              </p>
            </div>
            <Slider
              value={[painDraft.intensity]}
              max={10}
              min={0}
              step={1}
              onValueChange={([value]) => updatePainDraft({ intensity: value })}
            />
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>Leve</span>
              <span>Intensa</span>
            </div>
          </div>

          <div className="card-surface p-6">
            <p className="section-label">Tipo de dor</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {painTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updatePainDraft({ painType: type })}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    painDraft.painType === type
                      ? 'bg-brand-gradient text-white shadow-glow'
                      : 'border border-white/80 bg-white/85 text-muted-foreground shadow-soft hover:bg-brand-50 hover:text-brand-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="card-surface p-6">
            <p className="section-label">Possíveis gatilhos</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {painTriggers.map((trigger) => {
                const active = selectedTriggers.includes(trigger)

                return (
                  <button
                    key={trigger}
                    type="button"
                    onClick={() => toggleTrigger(trigger)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                        : 'border border-white/80 bg-white/85 text-muted-foreground shadow-soft hover:bg-brand-50 hover:text-brand-700'
                    }`}
                  >
                    {trigger}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card-surface p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Observações</p>
                <p className="text-sm text-muted-foreground">Adicione contexto para enriquecer seus insights.</p>
              </div>
            </div>
            <Textarea
              value={painDraft.note}
              onChange={(event) => updatePainDraft({ note: event.target.value })}
            />
            <Button className="mt-5 w-full">
              <Save className="h-4 w-4" />
              Salvar registro
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
