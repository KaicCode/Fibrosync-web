import { Pause, Play, StopCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface ExerciseTimerProps {
  durationMinutes: number;
  // Chamado ao finalizar o timer com o tempo real decorrido em minutos
  onFinish: (elapsedMinutes: number) => void;
}

// Formata segundos em MM:SS para exibição no cronômetro
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Cronômetro crescente que registra o tempo real praticado
export function ExerciseTimer({ durationMinutes, onFinish }: ExerciseTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Limpa o intervalo ao desmontar o componente
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = useCallback(() => {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const pause = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const finish = useCallback(() => {
    pause();
    // Converte segundos para minutos arredondando para cima (mínimo 1 min)
    const elapsedMinutes = Math.max(1, Math.ceil(elapsed / 60));
    onFinish(elapsedMinutes);
  }, [elapsed, onFinish, pause]);

  const estimatedSeconds = durationMinutes * 60;
  // Progresso visual em relação à duração estimada (máximo 100%)
  const progress = Math.min((elapsed / estimatedSeconds) * 100, 100);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Display do tempo decorrido */}
      <div className="relative flex h-40 w-40 items-center justify-center">
        {/* Anel de progresso via SVG */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="44"
            fill="none" stroke="#ede9fe" strokeWidth="8"
          />
          <circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke="#7B4DFF"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="text-center">
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {formatTime(elapsed)}
          </p>
          <p className="text-xs text-muted-foreground">
            de {formatTime(estimatedSeconds)}
          </p>
        </div>
      </div>

      {/* Controles do cronômetro */}
      <div className="flex gap-3">
        {!running ? (
          <Button onClick={start} className="gap-2">
            <Play className="h-4 w-4" />
            {elapsed === 0 ? 'Iniciar' : 'Retomar'}
          </Button>
        ) : (
          <Button variant="outline" onClick={pause} className="gap-2">
            <Pause className="h-4 w-4" />
            Pausar
          </Button>
        )}

        {/* Finalizar só aparece depois de pelo menos 10 segundos */}
        {elapsed >= 10 && (
          <Button variant="secondary" onClick={finish} className="gap-2">
            <StopCircle className="h-4 w-4" />
            Finalizar
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Você pode finalizar a qualquer momento.
      </p>
    </div>
  );
}
