'use client';

import { ClimateData } from '../../../domain/entities/ClimateData';
import { CO2Emission } from '../../../domain/entities/CO2Emission';
import { PoliticalProposal } from '../../../domain/entities/PoliticalProposal';
import {
  formatClimateNumber,
  getAtmosphereStatus,
  getSoilStatus,
  getTemperatureStatus,
} from '../../lib/climatePresentation';

type TableRow = ClimateData | PoliticalProposal | CO2Emission;

interface NationalTableProps {
  data: TableRow[];
  category: 'climate' | 'politics' | 'co2';
  activeFilter: string;
}

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapa',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceara',
  DF: 'Distrito Federal',
  ES: 'Espirito Santo',
  GO: 'Goias',
  MA: 'Maranhao',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Para',
  PB: 'Paraiba',
  PR: 'Parana',
  PE: 'Pernambuco',
  PI: 'Piaui',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondonia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'Sao Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

function isClimateRow(row: TableRow): row is ClimateData {
  return 'temperature' in row && 'atmosphereQuality' in row;
}

function isPoliticsRow(row: TableRow): row is PoliticalProposal {
  return 'isBeneficial' in row;
}

function isCO2Row(row: TableRow): row is CO2Emission {
  return 'emissionAmount' in row;
}

function getStateName(row: TableRow): string {
  if (isClimateRow(row) && row.stateName) return row.stateName;
  if ('title' in row && row.title) return String(row.title);
  return STATE_NAMES[row.stateId] || row.stateId;
}

// Status dot color for climate rows
const STATUS_COLORS = {
  cold:      'bg-blue-500',
  good:      'bg-emerald-500',
  attention: 'bg-yellow-500',
  high:      'bg-orange-500',
  severe:    'bg-red-500',
} as const;

function ClimateStatusDot({ row, filter }: { row: ClimateData; filter: string }) {
  const status =
    filter === 'atmosfera' ? getAtmosphereStatus(row)
    : filter === 'solo'    ? getSoilStatus(row)
    :                        getTemperatureStatus(row);
  return (
    <span
      className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${STATUS_COLORS[status]}`}
      title={status}
    />
  );
}

// Column definition type
type ColDef = { header: string; value: (row: TableRow) => string; width: string };

function getColumns(category: string, filter: string): ColDef[] {
  if (category === 'climate') {
    if (filter === 'atmosfera') {
      return [
        { header: 'PM2.5 (μg/m³)',  value: r => isClimateRow(r) ? formatClimateNumber(r.pm25Mean)            : '-', width: 'w-28' },
        { header: 'PM10 (μg/m³)',   value: r => isClimateRow(r) ? formatClimateNumber(r.pm10Mean)            : '-', width: 'w-28' },
        { header: 'CO (μg/m³)',     value: r => isClimateRow(r) ? formatClimateNumber(r.carbonMonoxideMean)  : '-', width: 'w-28' },
        { header: 'Nuvens (%)',     value: r => isClimateRow(r) ? formatClimateNumber(r.cloudCoverageMean)   : '-', width: 'w-24' },
      ];
    }
    if (filter === 'solo') {
      return [
        { header: 'Perda água (mm/d)', value: r => isClimateRow(r) ? formatClimateNumber(r.vegetationWaterLossMean)   : '-', width: 'w-32' },
        { header: 'Estresse hídr.',    value: r => isClimateRow(r) ? formatClimateNumber(r.vegetationWaterStressMean)  : '-', width: 'w-28' },
        { header: 'Cobertura veg.',    value: r => isClimateRow(r) ? formatClimateNumber(r.vegetationCoverIndexMean)   : '-', width: 'w-28' },
        { header: 'Focos NASA',        value: r => isClimateRow(r) ? formatClimateNumber(r.fireSpotsTotal)             : '-', width: 'w-24' },
      ];
    }
    // temperatura (default)
    return [
      { header: 'Máxima (°C)', value: r => isClimateRow(r) ? formatClimateNumber(r.temperatureMax) : '-', width: 'w-28' },
      { header: 'Média (°C)',  value: r => isClimateRow(r) ? formatClimateNumber(r.temperature)    : '-', width: 'w-28' },
      { header: 'Mínima (°C)', value: r => isClimateRow(r) ? formatClimateNumber(r.temperatureMin) : '-', width: 'w-28' },
    ];
  }

  if (category === 'politics') {
    return [
      { header: 'Proposta',  value: r => isPoliticsRow(r) ? (r.title || '-')                               : '-', width: 'flex-1 min-w-0' },
      { header: 'Status',    value: r => isPoliticsRow(r) ? (r.status || '-')                              : '-', width: 'w-32' },
      { header: 'Impacto',   value: r => isPoliticsRow(r) ? (r.isBeneficial ? 'Benefica' : 'Malefica')    : '-', width: 'w-24' },
    ];
  }

  // co2
  return [
    { header: 'Emissao (Ton)',    value: r => isCO2Row(r) ? r.emissionAmount.toLocaleString('pt-BR')                       : '-', width: 'w-36' },
    { header: 'Impacto relativo', value: r => isCO2Row(r) ? `${((r.emissionAmount / 300000) * 100).toFixed(1)}%`           : '-', width: 'w-32' },
    { header: 'Setor principal',  value: r => isCO2Row(r) ? (r.topPolluter || '-')                                         : '-', width: 'w-32' },
  ];
}

function getPoliticsImpactClass(row: TableRow): string {
  if (!isPoliticsRow(row)) return 'text-slate-300';
  return row.isBeneficial ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold';
}

export function NationalTable({ data, category, activeFilter }: NationalTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-[#111827]/60 backdrop-blur-md rounded-[2rem] border border-slate-800 shadow-2xl p-6 text-center text-slate-500 py-20">
        Nenhum dado encontrado para o periodo.
      </div>
    );
  }

  const cols = getColumns(category, activeFilter);

  return (
    <div className="flex h-full min-h-[620px] w-full flex-col rounded-[2rem] border border-slate-800 bg-[#111827]/60 p-6 text-slate-300 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <span className="w-6 flex-shrink-0 text-center">#</span>
        {/* status dot placeholder */}
        {category === 'climate' && <span className="w-2 flex-shrink-0" />}
        <span className="flex-1 min-w-0">Estado</span>
        {cols.map((col, i) => (
          <span key={i} className={`flex-shrink-0 text-right ${col.width}`}>{col.header}</span>
        ))}
      </div>

      {/* Rows */}
      <div
        data-skyflora-scroll-lock="true"
        className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-2"
      >
        {data.map((row, i) => {
          const stateName = getStateName(row);
          return (
            <div
              key={`${row.stateId}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-transparent bg-slate-800/20 px-4 py-3 transition-colors hover:border-slate-700/50 hover:bg-slate-800/50"
            >
              <span className="w-6 flex-shrink-0 text-center font-serif text-sm text-slate-500">{i + 1}</span>

              {category === 'climate' && isClimateRow(row) && (
                <ClimateStatusDot row={row} filter={activeFilter} />
              )}

              <span className="flex-1 min-w-0 truncate text-sm font-bold text-slate-200" title={stateName}>
                {stateName}
              </span>

              {cols.map((col, j) => {
                const val = col.value(row);
                const isImpactCol = category === 'politics' && col.header === 'Impacto';
                return (
                  <span
                    key={j}
                    className={`flex-shrink-0 text-right text-sm tabular-nums ${col.width} ${isImpactCol ? getPoliticsImpactClass(row) : 'text-slate-200'}`}
                    title={val}
                  >
                    {val}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
