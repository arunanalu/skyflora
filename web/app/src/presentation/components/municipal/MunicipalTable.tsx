'use client';

import { MunicipalClimateData } from '../../../domain/entities/MunicipalClimateData';
import { formatClimateNumber, getTemperatureStatus } from '../../lib/climatePresentation';

const STATUS_COLORS = {
  cold:      'bg-blue-500',
  good:      'bg-emerald-500',
  attention: 'bg-yellow-500',
  high:      'bg-orange-500',
  severe:    'bg-red-500',
} as const;

function fmt(value: number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined) return '-';
  return formatClimateNumber(value, suffix);
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3 animate-pulse">
      <div className="h-3 w-5 rounded bg-slate-700/60" />
      <div className="h-2 w-2 rounded-full bg-slate-700/60 flex-shrink-0" />
      <div className="h-3 flex-1 rounded bg-slate-700/60" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-3 w-16 rounded bg-slate-700/60 flex-shrink-0" />
      ))}
    </div>
  );
}

interface MunicipalTableProps {
  data: MunicipalClimateData[];
  loading: boolean;
}

export function MunicipalTable({ data, loading }: MunicipalTableProps) {
  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col gap-1 px-2">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
        Nenhum município encontrado para os filtros aplicados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span className="w-6 flex-shrink-0 text-center">#</span>
          <span className="w-2 flex-shrink-0" />
          <span className="w-44 flex-shrink-0">Município</span>
          <span className="w-20 flex-shrink-0 text-right">Máx (°C)</span>
          <span className="w-20 flex-shrink-0 text-right">Méd (°C)</span>
          <span className="w-20 flex-shrink-0 text-right">Mín (°C)</span>
          <span className="w-20 flex-shrink-0 text-right">Chuva (mm)</span>
          <span className="w-20 flex-shrink-0 text-right">PM2.5</span>
          <span className="w-20 flex-shrink-0 text-right">PM10</span>
          <span className="w-24 flex-shrink-0 text-right">CO (μg/m³)</span>
          <span className="w-24 flex-shrink-0 text-right">Perda água</span>
          <span className="w-24 flex-shrink-0 text-right">Est. hídr.</span>
          <span className="w-16 flex-shrink-0 text-right">Focos</span>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-1">
          {data.map((row, i) => {
            const status = getTemperatureStatus({
              temperature: row.temperatureMean ?? 0,
              temperatureMax: row.temperatureMax,
              temperatureMin: row.temperatureMin,
            });
            return (
              <div
                key={`${row.ibgeCode}-${row.date}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-transparent bg-slate-800/20 px-4 py-3 transition-colors hover:border-slate-700/50 hover:bg-slate-800/50"
              >
                <span className="w-6 flex-shrink-0 text-center font-serif text-sm text-slate-500">{i + 1}</span>
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_COLORS[status]}`} />
                <span className="w-44 flex-shrink-0 truncate text-sm font-bold text-slate-200" title={row.municipalityName}>
                  {row.municipalityName}
                </span>
                <span className="w-20 flex-shrink-0 text-right text-sm tabular-nums text-slate-200">{fmt(row.temperatureMax)}</span>
                <span className="w-20 flex-shrink-0 text-right text-sm tabular-nums text-slate-200">{fmt(row.temperatureMean)}</span>
                <span className="w-20 flex-shrink-0 text-right text-sm tabular-nums text-slate-200">{fmt(row.temperatureMin)}</span>
                <span className="w-20 flex-shrink-0 text-right text-sm tabular-nums text-slate-200">{fmt(row.precipitationMm)}</span>
                <span className="w-20 flex-shrink-0 text-right text-sm tabular-nums text-slate-200">{fmt(row.pm25)}</span>
                <span className="w-20 flex-shrink-0 text-right text-sm tabular-nums text-slate-200">{fmt(row.pm10)}</span>
                <span className="w-24 flex-shrink-0 text-right text-sm tabular-nums text-slate-200">{fmt(row.carbonMonoxide)}</span>
                <span className="w-24 flex-shrink-0 text-right text-sm tabular-nums text-slate-200">{fmt(row.waterLoss)}</span>
                <span className="w-24 flex-shrink-0 text-right text-sm tabular-nums text-slate-200">{fmt(row.waterStress)}</span>
                <span className="w-16 flex-shrink-0 text-right text-sm tabular-nums text-slate-200">{fmt(row.fireSpots)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
