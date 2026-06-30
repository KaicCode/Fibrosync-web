import { CheckCircle2, Clock, Dumbbell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type Exercise,
} from '@/services/exercise.service';

interface ExerciseCardProps {
  exercise: Exercise;
  completedToday: boolean;
  onViewDetails: (exercise: Exercise) => void;
  onComplete: (exercise: Exercise) => void;
}

// Card de exercício seguindo o padrão card-surface do design system
export function ExerciseCard({
  exercise,
  completedToday,
  onViewDetails,
  onComplete,
}: ExerciseCardProps) {
  return (
    <div className="card-surface flex flex-col overflow-hidden">
      {/* Imagem do exercício */}
      <div className="relative h-44 bg-slate-100">
        {exercise.imageUrl ? (
          <img
            src={exercise.imageUrl}
            alt={exercise.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Dumbbell className="h-12 w-12 text-slate-300" />
          </div>
        )}

        {/* Selo "Concluído hoje" sobreposto à imagem */}
        {completedToday && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/60">
            <div className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow">
              <CheckCircle2 className="h-4 w-4" />
              Concluído hoje
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo do card */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Badges de categoria e dificuldade */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">{CATEGORY_LABELS[exercise.category]}</Badge>
          <Badge variant="default">{DIFFICULTY_LABELS[exercise.difficulty]}</Badge>
        </div>

        <div>
          <h3 className="font-semibold text-foreground">{exercise.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {exercise.description}
          </p>
        </div>

        {/* Tempo estimado */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{exercise.durationMinutes} min</span>
        </div>

        {/* Benefícios resumidos */}
        {exercise.benefits.length > 0 && (
          <ul className="space-y-1">
            {exercise.benefits.slice(0, 2).map((benefit) => (
              <li key={benefit} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {benefit}
              </li>
            ))}
          </ul>
        )}

        {/* Ações do card */}
        <div className="mt-auto flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(exercise)}
          >
            Ver detalhes
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={completedToday}
            onClick={() => onComplete(exercise)}
          >
            {completedToday ? 'Concluído' : 'Iniciar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
