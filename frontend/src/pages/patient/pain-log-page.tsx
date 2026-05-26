import { useState } from 'react'
import { HeartPulse, Save, Sparkles, LoaderCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BodyMap } from '@/components/body-map'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { usePageTitle } from '@/hooks/use-page-title'
import { ApiError } from '@/lib/api-client'
import { bodyPointLabels, painTriggers, painTypes } from '@/services/mock-data'
import { useAppStore } from '@/store/app-store'
import { useDailyRecords } from '@/hooks/useDailyRecords'

export function PainLogPage() {
  usePageTitle('Registro de Dor')

  const navigate = useNavigate()
  const painDraft = useAppStore((state) => state.painDraft)
  const updatePainDraft = useAppStore((state) => state.updatePainDraft)
  const resetPainDraft = useAppStore((state) => state.resetPainDraft)
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([])
  const { createRecord, isCreating } = useDailyRecords()

  const todayLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
  }).format(new Date())

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

  const handleSave = async () => {
    const painLevel = Math.min(Math.max(painDraft.intensity, 0), 10)
    const mood = Math.max(0, 10 - painLevel)

    try {
      await createRecord({
        painLevel,
        fatigueLevel: painLevel,
        stressLevel: painLevel,
        mood,
        sleepQuality: 0,
        notes: painDraft.note.trim() || undefined,
        painType: painDraft.painType || undefined,
        painAreas: painDraft.selectedPoints.map(
          (point) => bodyPointLabels[point as keyof typeof bodyPointLabels] ?? point,
        ),
        painTriggers: selectedTriggers,
      })

      resetPainDraft()
      setSelectedTriggers([])
      window.alert('Registro de dor salvo com sucesso.')
      navigate('/app')
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 409) {
        window.alert('Já existe um registro para hoje.')
        return
      }

      if (error instanceof Error) {
        window.alert(`Erro ao salvar: ${error.message}`)
      } else {
        window.alert('Erro desconhecido ao salvar o registro.')
      }
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Registro diário"
        title="Mapeie o seu corpo com precisão gentil"
        description="Selecione áreas de dor, intensidade e gatilhos percebidos para construir um histórico mais inteligente."
        actions={<Badge variant="default">Hoje, {todayLabel}</Badge>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(18rem,0.98fr)]">
        <div className="card-surface p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Mapa corporal</p>
              <h2 className="mt-2 text-xl font-semibold md:text-2xl">Onde a dor está presente?</h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <HeartPulse className="h-4 w-4" />
            </div>
          </div>
          <BodyMap
            selectedPoints={painDraft.selectedPoints}
            onTogglePoint={togglePoint}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {painDraft.selectedPoints.map((point) => (
              <Badge key={point}>{bodyPointLabels[point as keyof typeof bodyPointLabels]}</Badge>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-surface p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="section-label">Intensidade</p>
                <h2 className="mt-2 text-xl font-semibold md:text-2xl">Nível atual da dor</h2>
              </div>
              <p className="text-2xl font-semibold tracking-[-0.06em] text-brand-700 md:text-[1.8rem]">
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

          <div className="card-surface p-5">
            <p className="section-label">Tipo de dor</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {painTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updatePainDraft({ painType: type })}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
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

          <div className="card-surface p-5">
            <p className="section-label">Possíveis gatilhos</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {painTriggers.map((trigger) => {
                const active = selectedTriggers.includes(trigger)

                return (
                  <button
                    key={trigger}
                    type="button"
                    onClick={() => toggleTrigger(trigger)}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
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

          <div className="card-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Sparkles className="h-4 w-4" />
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
            <Button className="mt-4 w-full" onClick={handleSave} disabled={isCreating}>
              {isCreating ? <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isCreating ? 'Salvando...' : 'Salvar registro'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
