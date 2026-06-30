import { cn } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/services/exercise.service';
import type { ExerciseCategory } from '@/services/exercise.service';

// Todas as categorias disponíveis para filtro, incluindo "Todos"
const FILTER_OPTIONS = (
  Object.keys(CATEGORY_LABELS) as Array<ExerciseCategory | 'all'>
).sort((a) => (a === 'all' ? -1 : 1));

interface ExerciseCategoryFilterProps {
  value: ExerciseCategory | 'all';
  onChange: (category: ExerciseCategory | 'all') => void;
}

// Barra de filtros por categoria — mesmo estilo das TabsList do sistema
export function ExerciseCategoryFilter({
  value,
  onChange,
}: ExerciseCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            value === cat
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white/70 text-muted-foreground hover:bg-white hover:text-foreground border border-white/80',
          )}
        >
          {CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  );
}
