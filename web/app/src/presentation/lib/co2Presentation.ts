import { CO2Emission, CO2Sector } from '../../domain/entities/CO2Emission';

// Percentile-based color: states are ranked 0–1 within the dataset.
// This guarantees visual spread regardless of absolute emission values.
export function getCO2TotalEmissionColor(percentile: number): string {
  if (percentile < 0.20) return '#86efac'; // green     — lowest 20%
  if (percentile < 0.40) return '#fde047'; // yellow    — 20–40%
  if (percentile < 0.60) return '#fb923c'; // orange    — 40–60%
  if (percentile < 0.80) return '#ef4444'; // red       — 60–80%
  return '#7f1d1d';                        // dark red  — top 20%
}

const SECTOR_COLORS: Record<string, string> = {
  'Mudança de Uso da Terra e Floresta': '#16a34a',
  'Agropecuária':                        '#b45309',
  'Energia':                             '#2563eb',
  'Processos Industriais':               '#9333ea',
  'Resíduos':                            '#6b7280',
};

export function getCO2SectorColor(sector: CO2Sector): string {
  return SECTOR_COLORS[sector] ?? '#475569';
}

// Intensity of deforestation relative to the most deforesting state (linear ratio)
export function getCO2DeforestationColor(deforestationEmission: number, maxDeforestation: number): string {
  if (maxDeforestation <= 0 || deforestationEmission <= 0) return '#1e3a2b';
  const ratio = deforestationEmission / maxDeforestation;
  if (ratio < 0.08) return '#bbf7d0';
  if (ratio < 0.20) return '#4ade80';
  if (ratio < 0.40) return '#f59e0b';
  if (ratio < 0.65) return '#ef4444';
  return '#7f1d1d';
}

export function formatCO2Emission(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} Mt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} kt`;
  return value.toLocaleString('pt-BR');
}

export interface CO2Maxima {
  maxDeforestation: number;
  // percentile rank for each stateId (0 = lowest emitter, 1 = highest)
  totalEmissionPercentile: Map<string, number>;
}

// Precompute dataset-level values for use in InteractiveMap
export function computeCO2Maxima(data: CO2Emission[]): CO2Maxima {
  let maxDeforestation = 0;

  for (const row of data) {
    const deforest = row.top5.find((e) => e.sector === 'Mudança de Uso da Terra e Floresta');
    const dv = deforest?.sectorTotalEmission ?? 0;
    if (dv > maxDeforestation) maxDeforestation = dv;
  }

  // Rank states by totalEmission ascending, assign percentile 0–1
  const sorted = [...data].sort((a, b) => a.totalEmission - b.totalEmission);
  const totalEmissionPercentile = new Map<string, number>();
  const n = sorted.length;
  sorted.forEach((row, i) => {
    totalEmissionPercentile.set(row.stateId, n <= 1 ? 1 : i / (n - 1));
  });

  return { maxDeforestation, totalEmissionPercentile };
}
