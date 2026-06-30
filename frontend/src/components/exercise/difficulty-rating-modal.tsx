import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DIFFICULTY_REPORTED_LABELS, type DifficultyReported } from '@/services/exercise.service';
import { cn } from '@/lib/utils';

interface DifficultyRatingModalProps {
  open: boolean;
  exerciseTitle: string;
  onConfirm: (difficulty: DifficultyReported, notes: string) => void;
  isLoading?: boolean;
}

const DIFFICULTY_OPTIONS: DifficultyReported[] = [
  'VERY_EASY', 'EASY', 'NORMAL', 'HARD', 'VERY_HARD',
];

// Cores visuais para cada opção de dificuldade
const DIFFICULTY_COLORS: Record<DifficultyReported, string> = {
  VERY_EASY: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
  EASY: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100',
  NORMAL: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100',
  HARD: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
  VERY_HARD: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100',
};

const DIFFICULTY_COLORS_SELECTED: Record<DifficultyReported, string> = {
  VERY_EASY: 'bg-emerald-500 border-emerald-500 text-white',
  EASY: 'bg-sky-500 border-sky-500 text-white',
  NORMAL: 'bg-violet-500 border-violet-500 text-white',
  HARD: 'bg-amber-500 border-amber-500 text-white',
  VERY_HARD: 'bg-rose-500 border-rose-500 text-white',
};

// Modal exibido após o cronômetro: coleta avaliação de dificuldade e observações
export function DifficultyRatingModal({
  open,
  exerciseTitle,
  onConfirm,
  isLoading = false,
}: DifficultyRatingModalProps) {
  const [selected, setSelected] = useState<DifficultyReported | null>(null);
  const [notes, setNotes] = useState('');

  function handleConfirm() {
    if (!selected) return;
    onConfirm(selected, notes);
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-brand-500">Exercício concluído!</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{exerciseTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Como você se sentiu?</p>
          </div>

          {/* Opções de dificuldade percebida */}
          <div className="grid grid-cols-1 gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelected(opt)}
                className={cn(
                  'rounded-xl border px-4 py-2.5 text-sm font-medium text-left transition-all',
                  selected === opt
                    ? DIFFICULTY_COLORS_SELECTED[opt]
                    : DIFFICULTY_COLORS[opt],
                )}
              >
                {DIFFICULTY_REPORTED_LABELS[opt]}
              </button>
            ))}
          </div>

          {/* Campo de observações opcional */}
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">
              Deseja adicionar alguma observação? (opcional)
            </p>
            <Textarea
              placeholder="Como foi a sessão, como o corpo está respondendo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleConfirm}
            disabled={!selected || isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar histórico'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
