import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BatteryCharging,
  CalendarDays,
  Check,
  CloudSun,
  Droplets,
  HeartPulse,
  LoaderCircle,
  LocateFixed,
  Minus,
  MoonStar,
  Plus,
  Save,
  Sparkles,
  Waves,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { BodyMap } from "@/components/body-map";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  painTriggers,
  painTypes,
  resolveBodyAreaLabels,
  resolvePainDescriptor,
  symptomSignalCatalog,
  type SymptomSignalConfig,
} from "@/features/clinical/clinical-model";
import { useDailyRecords } from "@/hooks/useDailyRecords";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCurrentLocation, useWeather } from "@/hooks/useWeather";
import { cn } from "@/lib/utils";

type SymptomState = {
  stiffness: number;
  cognitiveFog: boolean;
  cognitiveFogLevel: number;
  headache: boolean;
  headacheLevel: number;
  digestiveIssues: boolean;
  digestiveIssuesLevel: number;
  anxiety: boolean;
  anxietyLevel: number;
  depression: boolean;
  depressionLevel: number;
  sensitivityLight: boolean;
  sensitivityLightLevel: number;
  sensitivityNoise: boolean;
  sensitivityNoiseLevel: number;
  bodyTemperatureFeeling: string;
  notes: string;
};

type RecordFormState = {
  recordDate: string;
  frontPainAreas: string[];
  backPainAreas: string[];
  painLevel: number;
  fatigueLevel: number;
  batteryLevel: number;
  stressLevel: number;
  moodLevel: number;
  sleepQuality: number;
  sleepHours: number;
  hydration: number;
  physicalActivityMinutes: number;
  medicationTaken: boolean;
  painType: string;
  painTriggers: string[];
  weatherImpact: string;
  notes: string;
  symptomSignal: SymptomState;
};

type ScaleTileProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  highIsPositive?: boolean;
  icon: typeof HeartPulse;
};

type NumberTileProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
  icon: typeof HeartPulse;
};

const bodyStateScales = [
  {
    key: "fatigueLevel",
    label: "Fadiga",
    highIsPositive: false,
    icon: HeartPulse,
  },
  {
    key: "batteryLevel",
    label: "Bateria",
    highIsPositive: true,
    icon: BatteryCharging,
  },
  {
    key: "stressLevel",
    label: "Estresse",
    highIsPositive: false,
    icon: Waves,
  },
  {
    key: "moodLevel",
    label: "Humor",
    highIsPositive: true,
    icon: Sparkles,
  },
  {
    key: "sleepQuality",
    label: "Sono",
    highIsPositive: true,
    icon: MoonStar,
  },
] as const;

const quickSymptomConfigs = symptomSignalCatalog.filter(
  (signal) => signal.key !== "stiffness",
);

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function resolveInitialRecordDate(value: string | null): string {
  if (
    value &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    formatDateKey(parseDateKey(value)) === value
  ) {
    return value;
  }

  return formatDateKey(new Date());
}

function formatSelectedDate(recordDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(parseDateKey(recordDate));
}

function createInitialState(recordDate: string): RecordFormState {
  return {
    recordDate,
    frontPainAreas: [],
    backPainAreas: [],
    painLevel: 4,
    fatigueLevel: 5,
    batteryLevel: 6,
    stressLevel: 4,
    moodLevel: 6,
    sleepQuality: 5,
    sleepHours: 7,
    hydration: 1.8,
    physicalActivityMinutes: 20,
    medicationTaken: false,
    painType: "",
    painTriggers: [],
    weatherImpact: "",
    notes: "",
    symptomSignal: {
      stiffness: 0,
      cognitiveFog: false,
      cognitiveFogLevel: 0,
      headache: false,
      headacheLevel: 0,
      digestiveIssues: false,
      digestiveIssuesLevel: 0,
      anxiety: false,
      anxietyLevel: 0,
      depression: false,
      depressionLevel: 0,
      sensitivityLight: false,
      sensitivityLightLevel: 0,
      sensitivityNoise: false,
      sensitivityNoiseLevel: 0,
      bodyTemperatureFeeling: "",
      notes: "",
    },
  };
}

function resolveScaleDescriptor(
  value: number,
  highIsPositive = false,
): { label: string; tone: "default" | "success" | "warning" } {
  if (highIsPositive) {
    if (value <= 3) {
      return { label: "Baixo", tone: "warning" };
    }

    if (value <= 6) {
      return { label: "Medio", tone: "default" };
    }

    return { label: "Bom", tone: "success" };
  }

  if (value <= 3) {
    return { label: "Leve", tone: "success" };
  }

  if (value <= 6) {
    return { label: "Moderado", tone: "default" };
  }

  return { label: "Alto", tone: "warning" };
}

function ToggleChip({
  active,
  label,
  onClick,
  size = "md",
  showCheck = true,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  size?: "lg" | "md" | "sm";
  showCheck?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border font-semibold transition-all duration-200",
        size === "lg" && "gap-2 px-4 py-2 text-sm",
        size === "md" && "gap-1.5 px-3.5 py-2 text-sm",
        size === "sm" && "gap-1.5 px-3 py-1.5 text-xs",
        active
          ? "border-violet-300 bg-[linear-gradient(135deg,#8b5cf6,#7c3aed)] text-white shadow-[0_12px_28px_rgba(124,58,237,0.26)]"
          : "border-slate-200/80 bg-white/92 text-slate-800 shadow-[0_8px_18px_rgba(148,163,184,0.08)] hover:border-violet-200 hover:bg-violet-50/90 hover:text-violet-800",
      )}
      aria-pressed={active}
    >
      {active && showCheck ? <Check className="h-3.5 w-3.5" /> : null}
      {label}
    </button>
  );
}

function SelectionGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-[1.35rem] border border-white/85 bg-white/84 p-4 shadow-soft">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="text-sm leading-5 text-slate-500">{description}</p>
      </div>
      <div className="h-px bg-[linear-gradient(90deg,rgba(139,92,246,0.2),rgba(203,213,225,0.72),transparent)]" />
      {children}
    </div>
  );
}

function ScaleTile({
  label,
  value,
  onChange,
  highIsPositive = false,
  icon: Icon,
}: ScaleTileProps) {
  const descriptor = resolveScaleDescriptor(value, highIsPositive);

  return (
    <div className="glass-surface p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {label}
              </p>
              <p className="text-lg font-semibold text-slate-950">{value}/10</p>
            </div>
          </div>
        </div>
        <Badge variant={descriptor.tone}>{descriptor.label}</Badge>
      </div>
      <Slider
        min={0}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(next) => onChange(next[0] ?? value)}
        aria-label={label}
      />
    </div>
  );
}

function NumberTile({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  icon: Icon,
}: NumberTileProps) {
  return (
    <div className="glass-surface p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="text-sm font-semibold text-slate-950">
            {value}
            {suffix}
          </p>
        </div>
      </div>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        className="h-10"
        aria-label={label}
      />
    </div>
  );
}

function SymptomPill({
  config,
  active,
  level,
  onToggle,
  onAdjust,
}: {
  config: SymptomSignalConfig;
  active: boolean;
  level: number;
  onToggle: () => void;
  onAdjust: (delta: number) => void;
}) {
  return (
    <motion.div
      layout
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1.5 transition-all duration-200",
        active
          ? "border-violet-300 bg-[linear-gradient(135deg,rgba(139,92,246,0.96),rgba(124,58,237,0.92))] text-white shadow-[0_12px_24px_rgba(124,58,237,0.18)]"
          : "border-white/85 bg-white/90 text-slate-800 shadow-[0_8px_18px_rgba(148,163,184,0.08)]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold"
        aria-pressed={active}
        aria-label={`${config.label} ${active ? "ativo" : "inativo"}`}
      >
        {active ? <Check className="h-3.5 w-3.5" /> : null}
        <span>{config.label}</span>
      </button>
      {active ? (
        <>
          <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-violet-900">
            {level}/10
          </span>
          <button
            type="button"
            onClick={() => onAdjust(-1)}
            className="rounded-full border border-violet-200 bg-white p-1 text-violet-700 transition hover:bg-violet-100"
            aria-label={`Reduzir ${config.label}`}
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onAdjust(1)}
            className="rounded-full border border-violet-200 bg-white p-1 text-violet-700 transition hover:bg-violet-100"
            aria-label={`Aumentar ${config.label}`}
          >
            <Plus className="h-3 w-3" />
          </button>
        </>
      ) : null}
    </motion.div>
  );
}

function resolveWeatherSummary(
  weather:
    | {
        temperature: number;
        humidity: number;
        pressure: number;
        precipitation: number;
      }
    | null
    | undefined,
): string {
  if (!weather) {
    return "Sem leitura automatica no momento";
  }

  let condition = "Clima estavel";

  if (weather.pressure < 1000) {
    condition = "Pressao baixa detectada";
  } else if (weather.precipitation > 0) {
    condition = "Chuva em andamento";
  } else if (weather.humidity >= 70) {
    condition = "Umidade alta";
  }

  return `${Math.round(weather.temperature)}°C • Umidade ${Math.round(weather.humidity)}% • ${condition}`;
}

export function PainLogPage() {
  usePageTitle("Registro de Dor");

  const [searchParams] = useSearchParams();
  const initialRecordDate = resolveInitialRecordDate(searchParams.get("date"));
  const [form, setForm] = useState<RecordFormState>(() =>
    createInitialState(initialRecordDate),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { createRecord, isCreating } = useDailyRecords();
  const isCurrentDayRecord = form.recordDate === formatDateKey(new Date());
  const {
    coordinates,
    status: locationStatus,
    errorMessage: locationError,
    requestLocation,
  } = useCurrentLocation(isCurrentDayRecord);
  const {
    weather,
    impactMessage,
    sourceLabel,
    isWeatherRiskElevated,
    isLoading: isLoadingWeather,
    refetch: refetchWeather,
  } = useWeather(coordinates?.lat, coordinates?.lon);

  const painDescriptor = resolvePainDescriptor(form.painLevel);
  const selectedAreaLabels = useMemo(
    () =>
      resolveBodyAreaLabels([
        ...form.frontPainAreas,
        ...form.backPainAreas,
      ]),
    [form.backPainAreas, form.frontPainAreas],
  );
  const deferredAreaLabels = useDeferredValue(selectedAreaLabels);
  const selectedDateLabel = useMemo(
    () => formatSelectedDate(form.recordDate),
    [form.recordDate],
  );
  const activeSymptomCount = useMemo(
    () =>
      quickSymptomConfigs.filter((signal) => {
        const levelKey = signal.levelKey as keyof SymptomState;
        return Number(form.symptomSignal[levelKey]) > 0;
      }).length,
    [form.symptomSignal],
  );

  function updateField<K extends keyof RecordFormState>(
    key: K,
    value: RecordFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateSymptomField<K extends keyof SymptomState>(
    key: K,
    value: SymptomState[K],
  ) {
    setForm((current) => ({
      ...current,
      symptomSignal: {
        ...current.symptomSignal,
        [key]: value,
      },
    }));
  }

  function toggleArea(side: "frontPainAreas" | "backPainAreas", areaId: string) {
    setForm((current) => {
      const exists = current[side].includes(areaId);
      return {
        ...current,
        [side]: exists
          ? current[side].filter((item) => item !== areaId)
          : [...current[side], areaId],
      };
    });
  }

  function toggleTrigger(trigger: string) {
    setForm((current) => ({
      ...current,
      painTriggers: current.painTriggers.includes(trigger)
        ? current.painTriggers.filter((item) => item !== trigger)
        : [...current.painTriggers, trigger],
    }));
  }

  function toggleSymptom(config: SymptomSignalConfig) {
    setForm((current) => {
      const levelKey = config.levelKey as keyof SymptomState;
      const key = config.key as keyof SymptomState;
      const isActive = Number(current.symptomSignal[levelKey]) > 0;
      const nextLevel = isActive
        ? 0
        : Math.max(Number(current.symptomSignal[levelKey]) || 5, 1);

      return {
        ...current,
        symptomSignal: {
          ...current.symptomSignal,
          [key]: !isActive,
          [levelKey]: nextLevel,
        } as SymptomState,
      };
    });
  }

  function adjustSymptom(config: SymptomSignalConfig, delta: number) {
    setForm((current) => {
      const levelKey = config.levelKey as keyof SymptomState;
      const key = config.key as keyof SymptomState;
      const previousLevel = Number(current.symptomSignal[levelKey]) || 0;
      const nextLevel = Math.min(Math.max(previousLevel + delta, 0), 10);

      return {
        ...current,
        symptomSignal: {
          ...current.symptomSignal,
          [key]: nextLevel > 0,
          [levelKey]: nextLevel,
        } as SymptomState,
      };
    });
  }

  function validateForm(): string | null {
    if (selectedAreaLabels.length === 0) {
      return "Selecione pelo menos uma area corporal para registrar a dor.";
    }

    if (form.sleepHours < 0 || form.sleepHours > 24) {
      return "Informe as horas de sono entre 0 e 24.";
    }

    if (form.hydration < 0 || form.hydration > 8) {
      return "A hidratacao precisa estar entre 0 e 8 litros.";
    }

    if (form.physicalActivityMinutes < 0 || form.physicalActivityMinutes > 1440) {
      return "Os minutos de atividade fisica precisam estar entre 0 e 1440.";
    }

    if (form.batteryLevel < 0 || form.batteryLevel > 10) {
      return "O nivel de bateria precisa estar entre 0 e 10.";
    }

    return null;
  }

  async function handleSave() {
    const validationError = validateForm();

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError(null);

    try {
      await createRecord({
        recordDate: form.recordDate,
        painLevel: form.painLevel,
        fatigueLevel: form.fatigueLevel,
        batteryLevel: form.batteryLevel,
        stressLevel: form.stressLevel,
        moodLevel: form.moodLevel,
        sleepQuality: form.sleepQuality,
        sleepHours: form.sleepHours,
        hydration: form.hydration,
        physicalActivityMinutes: form.physicalActivityMinutes,
        medicationTaken: form.medicationTaken,
        weatherImpact: form.weatherImpact.trim() || undefined,
        weatherSnapshot: isCurrentDayRecord ? weather ?? undefined : undefined,
        notes: form.notes.trim() || undefined,
        painType: form.painType || undefined,
        painAreas: selectedAreaLabels,
        frontPainAreas: resolveBodyAreaLabels(form.frontPainAreas),
        backPainAreas: resolveBodyAreaLabels(form.backPainAreas),
        painTriggers: form.painTriggers,
        symptomSignal: {
          stiffness: form.symptomSignal.stiffness,
          cognitiveFog: form.symptomSignal.cognitiveFog,
          cognitiveFogLevel: form.symptomSignal.cognitiveFog
            ? form.symptomSignal.cognitiveFogLevel
            : 0,
          headache: form.symptomSignal.headache,
          headacheLevel: form.symptomSignal.headache
            ? form.symptomSignal.headacheLevel
            : 0,
          digestiveIssues: form.symptomSignal.digestiveIssues,
          digestiveIssuesLevel: form.symptomSignal.digestiveIssues
            ? form.symptomSignal.digestiveIssuesLevel
            : 0,
          anxiety: form.symptomSignal.anxiety,
          anxietyLevel: form.symptomSignal.anxiety
            ? form.symptomSignal.anxietyLevel
            : 0,
          depression: form.symptomSignal.depression,
          depressionLevel: form.symptomSignal.depression
            ? form.symptomSignal.depressionLevel
            : 0,
          sensitivityLight: form.symptomSignal.sensitivityLight,
          sensitivityLightLevel: form.symptomSignal.sensitivityLight
            ? form.symptomSignal.sensitivityLightLevel
            : 0,
          sensitivityNoise: form.symptomSignal.sensitivityNoise,
          sensitivityNoiseLevel: form.symptomSignal.sensitivityNoise
            ? form.symptomSignal.sensitivityNoiseLevel
            : 0,
          bodyTemperatureFeeling:
            form.symptomSignal.bodyTemperatureFeeling || undefined,
          notes: form.symptomSignal.notes.trim() || undefined,
        },
      });

      window.alert("Registro multidimensional salvo com sucesso.");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar o registro agora.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Registro rapido"
        title="Registro de Dor"
        description="Fluxo curto para registrar dor, estado do corpo e sintomas em menos de um minuto."
        className="gap-2 rounded-[1.35rem] px-4 py-3 md:px-5 md:py-4"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-600" />
              <Input
                type="date"
                value={form.recordDate}
                max={formatDateKey(new Date())}
                onChange={(event) => updateField("recordDate", event.target.value)}
                className="h-10 w-[11.75rem] pl-9"
                aria-label="Data do registro"
              />
            </div>
            <Badge variant="neutral">{selectedDateLabel}</Badge>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(20rem,0.98fr)]">
        <div className="panel-surface p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="section-label">Mapa corporal</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                Onde a dor esta hoje?
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Frente e costas independentes para registrar sem confusao.
              </p>
            </div>
            <Badge variant="default">{selectedAreaLabels.length} areas</Badge>
          </div>

          <BodyMap
            compact
            showLegend={false}
            frontSelectedAreas={form.frontPainAreas}
            backSelectedAreas={form.backPainAreas}
            onToggleFrontArea={(areaId) => toggleArea("frontPainAreas", areaId)}
            onToggleBackArea={(areaId) => toggleArea("backPainAreas", areaId)}
          />

          <div className="mt-4 rounded-[1.35rem] border border-white/80 bg-white/86 p-4 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="section-label">Intensidade da dor</p>
                <div className="mt-1 flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-950">
                    {form.painLevel}/10
                  </h3>
                  <Badge variant={form.painLevel >= 7 ? "warning" : "default"}>
                    {painDescriptor.label}
                  </Badge>
                </div>
              </div>
              <p className="max-w-xs text-sm leading-5 text-slate-500">
                {painDescriptor.description}
              </p>
            </div>

            <div
              className={cn(
                "mt-3 mb-3 h-2.5 rounded-full bg-gradient-to-r",
                painDescriptor.fill,
              )}
            />
            <Slider
              min={0}
              max={10}
              step={1}
              value={[form.painLevel]}
              onValueChange={(next) =>
                updateField("painLevel", next[0] ?? form.painLevel)
              }
              aria-label="Intensidade da dor"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Sem dor</span>
              <span>Moderada</span>
              <span>Incapacitante</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <span>Areas selecionadas</span>
              <span>{selectedAreaLabels.length}/19</span>
            </div>
            {deferredAreaLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {deferredAreaLabels.map((label) => (
                  <Badge key={label} variant="neutral">
                    {label}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="rounded-[1rem] border border-dashed border-violet-200 bg-violet-50/70 px-3 py-2 text-sm text-violet-900">
                Selecione as regioes que melhor representam sua dor.
              </div>
            )}
          </div>
        </div>

        <div className="panel-surface p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="section-label">Estado atual do corpo</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                Escalas essenciais
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Um retrato rapido de como seu corpo esta agora.
              </p>
            </div>
            <Badge variant={form.medicationTaken ? "success" : "neutral"}>
              {form.medicationTaken ? "Medicacao registrada" : "Sem medicacao"}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {bodyStateScales.map((section) => (
              <ScaleTile
                key={section.key}
                label={section.label}
                value={form[section.key]}
                highIsPositive={section.highIsPositive}
                onChange={(value) => updateField(section.key, value)}
                icon={section.icon}
              />
            ))}
            <ScaleTile
              label="Rigidez"
              value={form.symptomSignal.stiffness}
              onChange={(value) => updateSymptomField("stiffness", value)}
              icon={Waves}
            />
            <NumberTile
              label="Horas dormidas"
              value={form.sleepHours}
              onChange={(value) => updateField("sleepHours", value)}
              min={0}
              max={24}
              step={0.5}
              suffix="h"
              icon={MoonStar}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <NumberTile
              label="Hidratacao"
              value={form.hydration}
              onChange={(value) => updateField("hydration", value)}
              min={0}
              max={8}
              step={0.1}
              suffix="L"
              icon={Droplets}
            />
            <NumberTile
              label="Atividade"
              value={form.physicalActivityMinutes}
              onChange={(value) => updateField("physicalActivityMinutes", value)}
              min={0}
              max={1440}
              step={5}
              suffix="min"
              icon={Activity}
            />
            <div className="glass-surface p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Medicacao
                  </p>
                  <p className="text-sm font-semibold text-slate-950">
                    {form.medicationTaken ? "Sim" : "Nao"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <ToggleChip
                  active={form.medicationTaken}
                  label="Sim"
                  onClick={() => updateField("medicationTaken", true)}
                />
                <ToggleChip
                  active={!form.medicationTaken}
                  label="Nao"
                  onClick={() => updateField("medicationTaken", false)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-surface p-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
          <div className="space-y-4">
            <div>
              <p className="section-label">Contexto rapido</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                Tipo de dor, gatilhos e sinais associados
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Escolha por grupos para enxergar rapido o que faz parte do dia.
              </p>
            </div>

            <SelectionGroup
              title="1. Tipo de dor"
              description="Escolha a sensacao principal que melhor descreve a dor agora."
            >
              <div className="flex flex-wrap gap-3">
                {painTypes.map((type) => (
                  <ToggleChip
                    key={type}
                    size="lg"
                    active={form.painType === type}
                    label={type}
                    onClick={() =>
                      updateField("painType", form.painType === type ? "" : type)
                    }
                  />
                ))}
              </div>
            </SelectionGroup>

            <SelectionGroup
              title="2. Gatilhos"
              description="Marque o que pareceu influenciar mais o seu corpo hoje."
            >
              <div className="flex flex-wrap gap-2.5">
                {painTriggers.map((trigger) => (
                  <ToggleChip
                    key={trigger}
                    size="md"
                    active={form.painTriggers.includes(trigger)}
                    label={trigger}
                    onClick={() => toggleTrigger(trigger)}
                  />
                ))}
              </div>
            </SelectionGroup>

            <SelectionGroup
              title="3. Sintomas associados"
              description="Ative os sinais que acompanharam a dor e ajuste a intensidade quando precisar."
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Sinais do dia
                </p>
                <Badge variant="neutral">{activeSymptomCount} ativos</Badge>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {quickSymptomConfigs.map((signal) => {
                  const levelKey = signal.levelKey as keyof SymptomState;
                  const level = Number(form.symptomSignal[levelKey]) || 0;

                  return (
                    <SymptomPill
                      key={signal.key}
                      config={signal}
                      active={level > 0}
                      level={level}
                      onToggle={() => toggleSymptom(signal)}
                      onAdjust={(delta) => adjustSymptom(signal, delta)}
                    />
                  );
                })}
              </div>
            </SelectionGroup>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  Clima do dia
                </p>
                <Badge variant="neutral">Contexto auxiliar</Badge>
              </div>
              {isCurrentDayRecord &&
              (locationStatus === "loading" ||
                (locationStatus === "ready" && isLoadingWeather)) ? (
                <div className="mt-2 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="mt-2 rounded-[1.05rem] border border-slate-200/80 bg-slate-50/78 px-3.5 py-3 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
                  {weather ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-800">
                          <CloudSun className="h-4 w-4 text-slate-500" />
                          <span>{resolveWeatherSummary(weather)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={
                              isWeatherRiskElevated ? "warning" : "success"
                            }
                          >
                            {isWeatherRiskElevated
                              ? "Maior impacto"
                              : "Impacto menor"}
                          </Badge>
                          {sourceLabel ? (
                            <Badge variant="neutral">{sourceLabel}</Badge>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-5 text-slate-600">
                        {impactMessage}
                      </p>
                    </>
                  ) : (
                    <div className="flex items-start gap-3">
                      <LocateFixed className="mt-0.5 h-4 w-4 text-slate-500" />
                      <div className="space-y-2">
                        <p className="text-sm leading-5 text-slate-600">
                          {isCurrentDayRecord
                            ? locationError ??
                              "Sem clima automatico agora. O registro continua funcionando normalmente."
                            : "Para datas anteriores, descreva manualmente o impacto do clima abaixo."}
                        </p>
                        {isCurrentDayRecord ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={requestLocation}
                          >
                            Tentar novamente
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {weather ? (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void refetchWeather()}
                >
                  Atualizar clima
                </Button>
              </div>
            ) : null}

            <SelectionGroup
              title="Percepcao corporal e observacoes"
              description="Adicione um ultimo contexto rapido antes de salvar."
            >
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-950">
                  Temperatura corporal percebida
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Frio", "Neutro", "Quente"].map((option) => (
                    <ToggleChip
                      key={option}
                      size="sm"
                      active={form.symptomSignal.bodyTemperatureFeeling === option}
                      label={option}
                      onClick={() =>
                        updateSymptomField(
                          "bodyTemperatureFeeling",
                          form.symptomSignal.bodyTemperatureFeeling === option
                            ? ""
                            : option,
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <Input
                value={form.weatherImpact}
                onChange={(event) =>
                  updateField("weatherImpact", event.target.value)
                }
                placeholder="Como o tempo pareceu afetar seu corpo hoje?"
                aria-label="Impacto percebido do clima"
              />

              <Textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className="min-h-[92px]"
                placeholder="Resumo curto da ultima dor: onde pegou mais, o que piorou e o que ajudou."
              />
            </SelectionGroup>
          </div>
        </div>
      </div>

      <div className="panel-surface flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {submitError ? (
            <span className="text-rose-700">{submitError}</span>
          ) : (
            <span className="text-slate-600">
              Revise rapidamente e salve quando estiver pronto.
            </span>
          )}
        </div>

        <Button size="lg" onClick={() => void handleSave()} disabled={isCreating}>
          {isCreating ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Salvando
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar registro
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
