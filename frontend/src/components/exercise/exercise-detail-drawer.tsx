import { CheckCircle2, ChevronRight, Clock, Dumbbell, ShieldAlert, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CATEGORY_LABELS, DIFFICULTY_LABELS, type Exercise } from '@/services/exercise.service';
import type { DifficultyReported } from '@/services/exercise.service';
import { ExerciseTimer } from './exercise-timer';
import { DifficultyRatingModal } from './difficulty-rating-modal';

interface ExerciseDetailDrawerProps {
  exercise: Exercise | null;
  completedToday: boolean;
  open: boolean;
  onClose: () => void;
  onComplete: (exerciseId: string, duration: number, difficulty: DifficultyReported, notes: string) => void;
  isCompleting: boolean;
}

type DrawerView = 'detail' | 'timer' | 'rating';

// Drawer de detalhes com fluxo: Detalhe → Timer → Avaliação
export function ExerciseDetailDrawer({
  exercise,
  completedToday,
  open,
  onClose,
  onComplete,
  isCompleting,
}: ExerciseDetailDrawerProps) {
  const [view, setView] = useState<DrawerView>('detail');
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);

  // Reseta o estado ao fechar o drawer
  function handleClose() {
    setView('detail');
    setElapsedMinutes(0);
    onClose();
  }

  function handleTimerFinish(minutes: number) {
    setElapsedMinutes(minutes);
    setView('rating');
  }

  function handleRatingConfirm(difficulty: DifficultyReported, notes: string) {
    if (!exercise) return;
    onComplete(exercise.id, elapsedMinutes, difficulty, notes);
    handleClose();
  }

  if (!exercise) return null;

  return (
    <>
      <Dialog open={open && view !== 'rating'} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          {view === 'detail' && (
            <>
              {/* Imagem do exercício */}
              <div className="h-48 shrink-0 bg-slate-100 overflow-hidden rounded-t-lg">
                {exercise.imageUrl ? (
                  <img
                    src={exercise.imageUrl}
                    alt={exercise.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Dumbbell className="h-16 w-16 text-slate-300" />
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-5 p-6">
                  {/* Badges e meta */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="neutral">{CATEGORY_LABELS[exercise.category]}</Badge>
                    <Badge variant="default">{DIFFICULTY_LABELS[exercise.difficulty]}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {exercise.durationMinutes} min
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{exercise.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{exercise.description}</p>
                  </div>

                  {/* Benefícios */}
                  {exercise.benefits.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Sparkles className="h-4 w-4 text-brand-500" />
                        Benefícios
                      </div>
                      <ul className="space-y-1.5">
                        {exercise.benefits.map((b) => (
                          <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Passo a passo */}
                  {exercise.instructions.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <ChevronRight className="h-4 w-4 text-brand-500" />
                        Passo a passo
                      </div>
                      <ol className="space-y-2">
                        {exercise.instructions.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Cuidados */}
                  {exercise.precautions.length > 0 && (
                    <div className="rounded-xl bg-amber-50 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                        <ShieldAlert className="h-4 w-4" />
                        Cuidados
                      </div>
                      <ul className="space-y-1">
                        {exercise.precautions.map((p) => (
                          <li key={p} className="text-sm text-amber-700">• {p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Botão de ação principal */}
              <div className="border-t border-white/60 p-4 shrink-0">
                {completedToday ? (
                  <Button className="w-full" disabled>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Concluído hoje
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => setView('timer')}>
                    Iniciar exercício
                  </Button>
                )}
              </div>
            </>
          )}

          {view === 'timer' && (
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-brand-500">Em andamento</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{exercise.title}</h2>
              </div>
              <ExerciseTimer
                durationMinutes={exercise.durationMinutes}
                onFinish={handleTimerFinish}
              />
              <Button variant="ghost" className="w-full" onClick={handleClose}>
                Cancelar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de avaliação de dificuldade — separado para controle de foco */}
      <DifficultyRatingModal
        open={view === 'rating'}
        exerciseTitle={exercise.title}
        onConfirm={handleRatingConfirm}
        isLoading={isCompleting}
      />
    </>
  );
}
