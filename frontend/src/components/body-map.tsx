import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import {
  backBodyAreas,
  frontBodyAreas,
  type BodyAreaDefinition,
} from "@/features/clinical/clinical-model";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type BodyMapProps = {
  frontSelectedAreas: string[];
  backSelectedAreas: string[];
  onToggleFrontArea: (areaId: string) => void;
  onToggleBackArea: (areaId: string) => void;
  compact?: boolean;
  showLegend?: boolean;
};

function FigureSilhouette({ side }: { side: "front" | "back" }) {
  return (
    <svg
      viewBox="0 0 180 320"
      className="pointer-events-none absolute inset-0 h-full w-full text-slate-500/70"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`body-fill-${side}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
          <stop offset="55%" stopColor="rgba(247,244,253,0.95)" />
          <stop offset="100%" stopColor="rgba(236,232,245,0.92)" />
        </linearGradient>
        <linearGradient id={`body-stroke-${side}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(71,85,105,0.55)" />
          <stop offset="100%" stopColor="rgba(139,92,246,0.35)" />
        </linearGradient>
        <filter id={`body-shadow-${side}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="12"
            floodColor="rgba(100,116,139,0.12)"
          />
        </filter>
      </defs>
      <g filter={`url(#body-shadow-${side})`}>
        <circle
          cx="90"
          cy="35"
          r="22"
          fill={`url(#body-fill-${side})`}
          stroke={`url(#body-stroke-${side})`}
          strokeWidth="1.6"
        />
        <path
          d="M67 60c-10 6-21 18-24 33l-8 35c-2 8 2 16 10 18 7 2 14-3 16-10l8-26 3 50-8 110c-1 9 5 16 13 16 8 0 14-6 15-14l8-70 8 70c1 8 7 14 15 14 8 0 14-7 13-16l-8-110 3-50 8 26c2 7 9 12 16 10 8-2 12-10 10-18l-8-35c-3-15-14-27-24-33"
          fill={`url(#body-fill-${side})`}
          stroke={`url(#body-stroke-${side})`}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M48 93c11 7 25 11 42 11s31-4 42-11"
        fill="none"
        stroke="rgba(148,163,184,0.28)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M90 58v165"
        fill="none"
        stroke="rgba(148,163,184,0.2)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {side === "front" ? (
        <>
          <path
            d="M60 74c8 8 18 12 30 12s22-4 30-12"
            fill="none"
            stroke="rgba(100,116,139,0.22)"
            strokeWidth="1.2"
          />
          <path
            d="M74 108c6 7 10 15 16 15s10-8 16-15"
            fill="none"
            stroke="rgba(100,116,139,0.18)"
            strokeWidth="1.1"
          />
          <path
            d="M78 136c4 6 8 9 12 9s8-3 12-9"
            fill="none"
            stroke="rgba(100,116,139,0.15)"
            strokeWidth="1"
          />
        </>
      ) : (
        <>
          <path
            d="M66 74c8 6 16 9 24 9s16-3 24-9"
            fill="none"
            stroke="rgba(100,116,139,0.22)"
            strokeWidth="1.2"
          />
          <path
            d="M70 112c8 8 13 17 20 17s12-9 20-17"
            fill="none"
            stroke="rgba(100,116,139,0.18)"
            strokeWidth="1.1"
          />
          <path
            d="M72 154c7 6 12 9 18 9s11-3 18-9"
            fill="none"
            stroke="rgba(100,116,139,0.15)"
            strokeWidth="1"
          />
        </>
      )}
    </svg>
  );
}

function AreaButton({
  area,
  selected,
  onToggle,
}: {
  area: BodyAreaDefinition;
  selected: boolean;
  onToggle: (areaId: string) => void;
}) {
  const centerX = area.x + area.width / 2;
  const centerY = area.y + area.height / 2;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.06 }}
          onClick={() => onToggle(area.id)}
          className={cn(
            "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2",
            selected
              ? "drop-shadow-[0_0_16px_rgba(139,92,246,0.22)]"
              : "hover:drop-shadow-[0_0_12px_rgba(139,92,246,0.14)]",
          )}
          style={{
            left: `${centerX}%`,
            top: `${centerY}%`,
          }}
          aria-pressed={selected}
          aria-label={`${area.label}. ${selected ? "Selecionada" : "Nao selecionada"}.`}
        >
          {selected ? (
            <motion.span
              aria-hidden="true"
              className="absolute h-5 w-5 rounded-full bg-violet-300/25"
              animate={{ opacity: [0.28, 0.5, 0.28], scale: [0.9, 1.08, 0.9] }}
              transition={{ duration: 2.1, repeat: Number.POSITIVE_INFINITY }}
            />
          ) : null}
          <span
            aria-hidden="true"
            className={cn(
              "absolute h-5 w-5 rounded-full bg-transparent",
              selected ? "bg-violet-200/10" : "bg-white/0",
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "relative rounded-full border transition-all duration-200",
              selected
                ? "h-3.5 w-3.5 border-violet-100 bg-violet-600 shadow-[0_0_0_3px_rgba(255,255,255,0.7),0_0_0_6px_rgba(139,92,246,0.12)]"
                : "h-3 w-3 border-[1.2px] border-slate-400/70 bg-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.72)] hover:border-violet-300 hover:bg-violet-100/70",
            )}
          />
          <span className="sr-only">{area.label}</span>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="border-white/15 bg-slate-950/95 px-3 py-2.5 shadow-[0_18px_42px_rgba(15,23,42,0.28)]"
      >
        <p className="font-semibold text-white">{area.label}</p>
        <p className="mt-1 text-white/75">{area.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

const FigureCard = memo(function FigureCard({
  title,
  subtitle,
  side,
  areas,
  selectedAreas,
  onToggleArea,
  compact = false,
}: {
  title: string;
  subtitle: string;
  side: "front" | "back";
  areas: BodyAreaDefinition[];
  selectedAreas: string[];
  onToggleArea: (areaId: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-surface relative overflow-hidden",
        compact ? "p-3" : "p-4",
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-3",
          compact ? "mb-2" : "mb-3",
        )}
      >
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p
            className={cn(
              "text-slate-500",
              compact ? "mt-1 text-[11px] leading-4" : "mt-1 text-xs leading-5",
            )}
          >
            {subtitle}
          </p>
        </div>
        <div className="rounded-full border border-white/80 bg-white/88 px-3 py-1 text-xs font-semibold text-violet-800 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
          {selectedAreas.length} selecionada{selectedAreas.length === 1 ? "" : "s"}
        </div>
      </div>

      <div
        className={cn(
          "relative mx-auto aspect-[9/16] w-full rounded-[1.8rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(246,243,250,0.92),rgba(240,236,247,0.88))] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_34px_rgba(148,163,184,0.08)]",
          compact ? "max-w-[12.75rem] px-3 py-2" : "max-w-[17rem] px-4 py-3",
        )}
      >
        <FigureSilhouette side={side} />
        {areas.map((area) => (
          <AreaButton
            key={area.id}
            area={area}
            selected={selectedAreas.includes(area.id)}
            onToggle={onToggleArea}
          />
        ))}
      </div>
    </div>
  );
});

export function BodyMap({
  frontSelectedAreas,
  backSelectedAreas,
  onToggleFrontArea,
  onToggleBackArea,
  compact = false,
  showLegend = true,
}: BodyMapProps) {
  return (
    <TooltipProvider>
      <div className={cn("grid sm:grid-cols-2", compact ? "gap-3" : "gap-4")}>
        <FigureCard
          title="Vista frontal"
          subtitle="16 regioes clinicas independentes para registrar dor difusa na parte anterior."
          side="front"
          areas={frontBodyAreas}
          selectedAreas={frontSelectedAreas}
          onToggleArea={onToggleFrontArea}
          compact={compact}
        />
        <FigureCard
          title="Vista traseira"
          subtitle="3 regioes posteriores separadas para cervical e costas, sem espelhar selecoes da frente."
          side="back"
          areas={backBodyAreas}
          selectedAreas={backSelectedAreas}
          onToggleArea={onToggleBackArea}
          compact={compact}
        />
      </div>
      {showLegend ? (
        <div className="mt-4 flex items-start gap-3 rounded-[1.25rem] border border-violet-100/80 bg-violet-50/70 px-4 py-3 text-sm text-violet-900">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
          <p>
            As selecoes usam as 19 areas do ACR 2010. Frente e costas possuem
            estados separados para evitar marcacoes espelhadas por engano.
          </p>
        </div>
      ) : null}
    </TooltipProvider>
  );
}
