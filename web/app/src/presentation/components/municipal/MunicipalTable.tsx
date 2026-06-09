'use client';

import { MunicipalClimateData } from '../../../domain/entities/MunicipalClimateData';
import {
  formatClimateNumber,
  getTemperatureStatus,
  getAtmosphereStatus,
  getSoilStatus,
} from '../../lib/climatePresentation';

type Filter = 'temperatura' | 'atmosfera' | 'solo';

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

function getStatus(row: MunicipalClimateData, filter: Filter) {
  if (filter === 'atmosfera') {
    return getAtmosphereStatus({ pm25Mean: row.pm25, pm10Mean: row.pm10, carbonMonoxideMean: row.carbonMonoxide });
  }
  if (filter === 'solo') {
    return getSoilStatus({
      vegetationWaterLossMean: row.waterLoss,
      vegetationWaterStressMean: row.waterStress,
      vegetationCoverIndexMean: row.vegetationIndex,
      fireSpotsTotal: row.fireSpots,
    });
  }
  return getTemperatureStatus({ temperature: row.temperatureMean ?? 0, temperatureMax: row.temperatureMax, temperatureMin: row.temperatureMin });
}

// Column definitions per filter

type ColDef = { header: string; cell: (row: MunicipalClimateData) => string; width: string };

function getColumns(filter: Filter): ColDef[] {
  if (filter === 'atmosfera') {
    return [
      { header: 'PM2.5 (μg/m³)',  cell: (r) => fmt(r.pm25),            width: 'w-28' },
      { header: 'PM10 (μg/m³)',   cell: (r) => fmt(r.pm10),            width: 'w-28' },
      { header: 'CO (μg/m³)',     cell: (r) => fmt(r.carbonMonoxide),  width: 'w-28' },
      { header: 'Nuvens (%)',     cell: (r) => fmt(r.cloudCoverage),   width: 'w-24' },
      { header: 'Chuva (mm)',     cell: (r) => fmt(r.precipitationMm), width: 'w-24' },
    ];
  }
  if (filter === 'solo') {
    return [
      { header: 'Perda água (mm/d)', cell: (r) => fmt(r.waterLoss),       width: 'w-32' },
      { header: 'Est. hídr.',        cell: (r) => fmt(r.waterStress),      width: 'w-24' },
      { header: 'Cobertura veg.',    cell: (r) => fmt(r.vegetationIndex),  width: 'w-28' },
      { header: 'Focos NASA',        cell: (r) => fmt(r.fireSpots),        width: 'w-24' },
      { header: 'Chuva (mm)',        cell: (r) => fmt(r.precipitationMm),  width: 'w-24' },
    ];
  }
  // temperatura
  return [
    { header: 'Máx (°C)',   cell: (r) => fmt(r.temperatureMax),  width: 'w-24' },
    { header: 'Média (°C)', cell: (r) => fmt(r.temperatureMean), width: 'w-24' },
    { header: 'Mín (°C)',   cell: (r) => fmt(r.temperatureMin),  width: 'w-24' },
    { header: 'Chuva (mm)', cell: (r) => fmt(r.precipitationMm), width: 'w-24' },
  ];
}

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3 animate-pulse">
      <div className="h-3 w-5 rounded bg-slate-700/60 flex-shrink-0" />
      <div className="h-2 w-2 rounded-full bg-slate-700/60 flex-shrink-0" />
      <div className="h-3 flex-1 rounded bg-slate-700/60" />
      {Array.from({ length: colCount }).map((_, i) => (
        <div key={i} className="h-3 w-20 rounded bg-slate-700/60 flex-shrink-0" />
      ))}
    </div>
  );
}

interface MunicipalTableProps {
  data: MunicipalClimateData[];
  loading: boolean;
  filter: Filter;
}

export function MunicipalTable({ data, loading, filter }: MunicipalTableProps) {
  const cols = getColumns(filter);

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} colCount={cols.length} />)}
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
    <div className="custom-scrollbar overflow-x-auto">
      <div className="min-w-[720px]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span className="w-6 flex-shrink-0 text-center">#</span>
          <span className="w-2 flex-shrink-0" />
          <span className="w-52 flex-shrink-0">Município</span>
          {cols.map((col) => (
            <span key={col.header} className={`flex-shrink-0 text-right ${col.width}`}>{col.header}</span>
          ))}
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-1">
          {data.map((row, i) => {
            const status = getStatus(row, filter);
            return (
              <div
                key={`${row.ibgeCode}-${row.date}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-transparent bg-slate-800/20 px-4 py-3 transition-colors hover:border-slate-700/50 hover:bg-slate-800/50"
              >
                <span className="w-6 flex-shrink-0 text-center font-serif text-sm text-slate-500">{i + 1}</span>
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_COLORS[status]}`} />
                <span className="w-52 flex-shrink-0 truncate text-sm font-bold text-slate-200" title={row.municipalityName}>
                  {row.municipalityName}
                </span>
                {cols.map((col) => (
                  <span
                    key={col.header}
                    className={`flex-shrink-0 text-right text-sm tabular-nums text-slate-200 ${col.width}`}
                  >
                    {col.cell(row)}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
