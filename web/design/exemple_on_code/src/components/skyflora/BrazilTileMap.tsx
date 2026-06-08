import { STATES, type StateRow } from "@/lib/skyflora-data";
import { motion } from "framer-motion";

// Geographic tilemap positions (col, row) for Brazilian states
const POS: Record<string, [number, number]> = {
  RR: [4, 0], AP: [5, 0],
  AM: [3, 1], PA: [4, 1], MA: [5, 1], CE: [6, 1], RN: [7, 1],
  AC: [2, 2], TO: [4, 2], PI: [5, 2], PE: [6, 2], PB: [7, 2],
  RO: [3, 3], BA: [5, 3], AL: [6, 3], SE: [7, 3],
  MT: [3, 4], GO: [4, 4], MG: [5, 4], ES: [6, 4],
  DF: [4, 5], MS: [3, 5], SP: [4, 6], RJ: [5, 6],
  PR: [3, 7], SC: [3, 8], RS: [2, 9],
};

interface Props {
  metric: keyof StateRow | "politicsScore";
  colorMode: "thermal" | "politics" | "co2";
  selected?: string | null;
  onSelect?: (uf: string) => void;
  showLabels?: boolean;
  showCounters?: boolean;
}

function valueFor(s: StateRow, metric: Props["metric"]): number {
  if (metric === "politicsScore") return (s.propsBenefit - s.propsHarm);
  const v = s[metric];
  return typeof v === "number" ? v : 0;
}

function colorFor(v: number, min: number, max: number, mode: Props["colorMode"]): string {
  const t = max === min ? 0.5 : (v - min) / (max - min);
  if (mode === "thermal") {
    // cool sky -> warm alert
    return `color-mix(in oklab, var(--sky) ${(1 - t) * 100}%, var(--alert) ${t * 100}%)`;
  }
  if (mode === "politics") {
    // negative => red, positive => green; t is 0..1 after normalize
    return `color-mix(in oklab, var(--destructive) ${(1 - t) * 100}%, var(--flora) ${t * 100}%)`;
  }
  // co2: light slate -> deep slate
  return `color-mix(in oklab, var(--muted) ${(1 - t) * 100}%, var(--slate-deep) ${t * 100}%)`;
}

export function BrazilTileMap({ metric, colorMode, selected, onSelect, showLabels = true, showCounters = false }: Props) {
  const values = STATES.map(s => valueFor(s, metric));
  const min = Math.min(...values);
  const max = Math.max(...values);

  const cell = 64;
  const gap = 6;
  const cols = 9;
  const rows = 11;
  const W = cols * (cell + gap);
  const H = rows * (cell + gap);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full max-h-[560px]" role="img" aria-label="Mapa do Brasil">
        {STATES.map((s, i) => {
          const pos = POS[s.uf];
          if (!pos) return null;
          const [c, r] = pos;
          const x = c * (cell + gap);
          const y = r * (cell + gap);
          const v = valueFor(s, metric);
          const fill = colorFor(v, min, max, colorMode);
          const isSel = selected === s.uf;
          const dim = selected && !isSel ? 0.35 : 1;
          return (
            <motion.g
              key={s.uf}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: dim, scale: isSel ? 1.08 : 1 }}
              transition={{ delay: i * 0.012, duration: 0.4 }}
              style={{ transformOrigin: `${x + cell / 2}px ${y + cell / 2}px`, cursor: "pointer" }}
              onClick={() => onSelect?.(s.uf)}
            >
              <rect
                x={x} y={y} width={cell} height={cell} rx={10}
                fill={fill}
                stroke={isSel ? "var(--foreground)" : "color-mix(in oklab, var(--foreground) 10%, transparent)"}
                strokeWidth={isSel ? 2 : 1}
              />
              {showLabels && (
                <text x={x + cell / 2} y={y + cell / 2 - 2} textAnchor="middle" dominantBaseline="middle"
                  fontSize={16} fontWeight={600} fill="var(--background)" style={{ pointerEvents: "none", mixBlendMode: "overlay" }}>
                  {s.uf}
                </text>
              )}
              {showCounters && (
                <text x={x + cell / 2} y={y + cell - 10} textAnchor="middle" fontSize={11} fill="var(--foreground)" opacity={0.85} style={{ pointerEvents: "none" }}>
                  {Math.round(v)}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
