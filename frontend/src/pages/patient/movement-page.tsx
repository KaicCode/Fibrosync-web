import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  LoaderCircle,
  TriangleAlert,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { ExerciseCategoryFilter } from '@/components/exercise/exercise-category-filter';
import { ExerciseCard } from '@/components/exercise/exercise-card';
import { ExerciseDetailDrawer } from '@/components/exercise/exercise-detail-drawer';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageTitle } from '@/hooks/use-page-title';
import { useExercises, useExerciseStats } from '@/hooks/useExercises';
import { useExerciseHistory } from '@/hooks/useExerciseHistory';
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type DifficultyReported,
  type Exercise,
  type ExerciseCategory,
} from '@/services/exercise.service';

// ─── Helpers de formatação ─────────────────────────────────────────────────

function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

// Agrupa o histórico por semana para o gráfico de barras
function buildWeeklyChartData(history: Array<{ completedAt: string; exercise: { durationMinutes: number }; durationPerformed: number | null }>) {
  const weekMap: Record<string, { week: string; count: number; minutes: number }> = {};

  for (const h of history) {
    const date = new Date(h.completedAt);
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const key = monday.toISOString().split('T')[0];
    const label = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(monday);

    if (!weekMap[key]) {
      weekMap[key] = { week: label, count: 0, minutes: 0 };
    }
    weekMap[key].count++;
    weekMap[key].minutes += h.durationPerformed ?? h.exercise.durationMinutes;
  }

  return Object.values(weekMap)
    .sort((a, b) => (a.week > b.week ? 1 : -1))
    .slice(-8); // últimas 8 semanas
}

// Conta ocorrências de cada categoria no histórico
function buildCategoryChartData(history: Array<{ exercise: { category: ExerciseCategory } }>) {
  const counts: Partial<Record<ExerciseCategory, number>> = {};
  for (const h of history) {
    counts[h.exercise.category] = (counts[h.exercise.category] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([category, count]) => ({
      category: CATEGORY_LABELS[category as ExerciseCategory],
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── Página principal ──────────────────────────────────────────────────────

export function MovementPage() {
  usePageTitle('Movimento Diário');

  // Estado de filtro de categoria e exercício selecionado para o drawer
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | 'all'>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Dados vindos dos hooks
  const { exercises, isLoading: loadingExercises } = useExercises(
    categoryFilter !== 'all' ? { category: categoryFilter } : undefined,
  );
  const { stats, isLoading: loadingStats } = useExerciseStats();
  const { history, isLoading: loadingHistory, completeExercise, isCompleting, completedTodayIds } =
    useExerciseHistory();

  // Dados para gráficos calculados em memória
  const weeklyData = useMemo(() => buildWeeklyChartData(history), [history]);
  const categoryData = useMemo(() => buildCategoryChartData(history), [history]);

  function handleViewDetails(exercise: Exercise) {
    setSelectedExercise(exercise);
    setDrawerOpen(true);
  }

  // Abre diretamente o drawer na aba do timer (sem precisar clicar em "Iniciar" dentro)
  function handleQuickStart(exercise: Exercise) {
    setSelectedExercise(exercise);
    setDrawerOpen(true);
  }

  async function handleComplete(
    exerciseId: string,
    duration: number,
    difficulty: DifficultyReported,
    notes: string,
  ) {
    await completeExercise({ exerciseId, durationPerformed: duration, difficultyReported: difficulty, notes });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Movimento Diário"
        description="Acompanhe seus exercícios físicos e desenvolva hábitos saudáveis no seu ritmo."
      />

      {/* ─── Cards de estatísticas ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Exercícios concluídos"
          value={loadingStats ? '—' : String(stats?.totalCompleted ?? 0)}
          hint="Total acumulado"
          icon={CheckCircle2}
        />
        <StatCard
          label="Sequência atual"
          value={loadingStats ? '—' : `${stats?.currentStreak ?? 0} dias`}
          hint={stats?.currentStreak ? 'Dias consecutivos' : 'Comece hoje!'}
          tone={stats?.currentStreak ? 'success' : 'default'}
          icon={Flame}
        />
        <StatCard
          label="Esta semana"
          value={loadingStats ? '—' : String(stats?.weeklyCount ?? 0)}
          hint="Últimos 7 dias"
          icon={CalendarDays}
        />
        <StatCard
          label="Tempo total"
          value={loadingStats ? '—' : formatMinutes(stats?.totalMinutes ?? 0)}
          hint="Minutos praticados"
          icon={Clock}
        />
      </div>

      {/* ─── Abas principais ─────────────────────────────────────────────── */}
      <Tabs defaultValue="exercises">
        <TabsList>
          <TabsTrigger value="exercises">Exercícios</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
        </TabsList>

        {/* ─── Aba: Lista de exercícios ──────────────────────────────────── */}
        <TabsContent value="exercises" className="space-y-5">
          <ExerciseCategoryFilter value={categoryFilter} onChange={setCategoryFilter} />

          {loadingExercises ? (
            <div className="flex h-48 items-center justify-center">
              <LoaderCircle className="h-7 w-7 animate-spin text-brand-500" />
            </div>
          ) : exercises.length === 0 ? (
            <div className="card-surface p-8 text-center text-muted-foreground">
              Nenhum exercício encontrado para esta categoria.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  completedToday={completedTodayIds.has(exercise.id)}
                  onViewDetails={handleViewDetails}
                  onComplete={handleQuickStart}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Aba: Histórico ───────────────────────────────────────────── */}
        <TabsContent value="history" className="space-y-4">
          {loadingHistory ? (
            <div className="flex h-48 items-center justify-center">
              <LoaderCircle className="h-7 w-7 animate-spin text-brand-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Activity className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Nenhum exercício registrado ainda</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Conclua seu primeiro exercício para ver o histórico aqui.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Exercício</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tempo</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Como foi</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatDate(item.completedAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.exercise.title}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral">
                            {CATEGORY_LABELS[item.exercise.category]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatMinutes(item.durationPerformed ?? item.exercise.durationMinutes)}
                        </td>
                        <td className="px-4 py-3">
                          {item.difficultyReported ? (
                            <Badge variant="default">
                              {DIFFICULTY_LABELS[item.difficultyReported as keyof typeof DIFFICULTY_LABELS] ?? item.difficultyReported}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                          {item.notes ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Aba: Evolução ────────────────────────────────────────────── */}
        <TabsContent value="evolution" className="space-y-5">
          {loadingHistory ? (
            <div className="flex h-48 items-center justify-center">
              <LoaderCircle className="h-7 w-7 animate-spin text-brand-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="card-surface rounded-[1.5rem] border border-amber-100 bg-white/92 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <TriangleAlert className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Sem dados suficientes</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Conclua alguns exercícios para visualizar os gráficos de evolução.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {/* Gráfico: exercícios por semana */}
              <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                <p className="text-sm font-medium text-brand-500">Constância</p>
                <h2 className="mt-2 text-xl font-semibold">Exercícios por semana</h2>
                <p className="mt-1 text-sm text-muted-foreground">Quantidade de sessões nas últimas semanas.</p>
                <div className="mt-5">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={weeklyData} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #ede9fe', fontSize: 12 }}
                        formatter={(v: number) => [`${v} exercício(s)`, 'Sessões']}
                      />
                      <Bar dataKey="count" fill="#7B4DFF" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico: tempo acumulado por semana */}
              <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                <p className="text-sm font-medium text-brand-500">Tempo praticado</p>
                <h2 className="mt-2 text-xl font-semibold">Minutos por semana</h2>
                <p className="mt-1 text-sm text-muted-foreground">Tempo total acumulado em cada semana.</p>
                <div className="mt-5">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="minutesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#53A2FF" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#53A2FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #ede9fe', fontSize: 12 }}
                        formatter={(v: number) => [`${v} min`, 'Tempo']}
                      />
                      <Area
                        type="monotone"
                        dataKey="minutes"
                        stroke="#53A2FF"
                        strokeWidth={2}
                        fill="url(#minutesGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico: categorias mais praticadas */}
              <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                <p className="text-sm font-medium text-brand-500">Preferências</p>
                <h2 className="mt-2 text-xl font-semibold">Categorias mais praticadas</h2>
                <div className="mt-5 space-y-3">
                  {categoryData.map((item, i) => {
                    const max = categoryData[0]?.count ?? 1;
                    const pct = Math.round((item.count / max) * 100);
                    const colors = ['#7B4DFF', '#53A2FF', '#7ED7B1', '#FF9A4D', '#F46EA3', '#FFC857'];
                    return (
                      <div key={item.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{item.category}</span>
                          <span className="text-muted-foreground">{item.count} sessões</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Taxa de conclusão: exercícios únicos concluídos / total no catálogo */}
              <div className="card-surface rounded-[1.5rem] border border-white/80 bg-white/92 p-5 shadow-[0_32px_84px_rgba(121,95,180,0.12)]">
                <p className="text-sm font-medium text-brand-500">Resumo geral</p>
                <h2 className="mt-2 text-xl font-semibold">Visão do progresso</h2>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-brand-50 p-4 text-center">
                    <p className="text-3xl font-bold text-brand-700">{stats?.totalCompleted ?? 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Total de sessões</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-700">{stats?.currentStreak ?? 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Dias seguidos</p>
                  </div>
                  <div className="rounded-2xl bg-sky-50 p-4 text-center">
                    <p className="text-3xl font-bold text-sky-700">{stats?.weeklyCount ?? 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Esta semana</p>
                  </div>
                  <div className="rounded-2xl bg-violet-50 p-4 text-center">
                    <p className="text-3xl font-bold text-violet-700">
                      {formatMinutes(stats?.totalMinutes ?? 0)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Tempo total</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Drawer de detalhes / timer ──────────────────────────────────── */}
      <ExerciseDetailDrawer
        exercise={selectedExercise}
        completedToday={selectedExercise ? completedTodayIds.has(selectedExercise.id) : false}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onComplete={handleComplete}
        isCompleting={isCompleting}
      />
    </div>
  );
}
