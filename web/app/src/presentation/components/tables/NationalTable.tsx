'use client';

import { ClimateData } from '../../../domain/entities/ClimateData';
import { CO2Emission } from '../../../domain/entities/CO2Emission';
import { PoliticalProposal } from '../../../domain/entities/PoliticalProposal';
import { formatClimateNumber, getClimateBarClass, getClimateBarPercent } from '../../lib/climatePresentation';

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

export function NationalTable({ data, category, activeFilter }: NationalTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-[#111827]/60 backdrop-blur-md rounded-[2rem] border border-slate-800 shadow-2xl p-6 text-center text-slate-500 py-20">
        Nenhum dado encontrado para o periodo.
      </div>
    );
  }

  const getColName = () => {
    if (category === 'climate') {
      if (activeFilter === 'atmosfera') return 'Particulas / nuvens';
      if (activeFilter === 'solo') return 'Agua / queimadas';
      return 'Temp. media';
    }
    if (category === 'politics') return 'Impacto';
    if (category === 'co2' && activeFilter === 'principais_poluidores') return 'Maior poluidor';
    return 'Emissao (Ton)';
  };

  const getRowValue = (row: TableRow) => {
    if (category === 'climate' && isClimateRow(row)) {
      if (activeFilter === 'atmosfera') {
        return `${formatClimateNumber(row.pm25Mean)} PM2.5`;
      }
      if (activeFilter === 'solo') {
        return `${formatClimateNumber(row.vegetationWaterLossMean)} mm/dia`;
      }
      return formatClimateNumber(row.temperature, ' C');
    }
    if (category === 'politics' && isPoliticsRow(row)) return row.isBeneficial ? 'Benefica' : 'Malefica';
    if (category === 'co2' && isCO2Row(row) && activeFilter === 'principais_poluidores') return row.topPolluter || '-';
    if (category === 'co2' && isCO2Row(row)) return row.emissionAmount.toLocaleString('pt-BR');
    return '-';
  };

  const getPercentage = (row: TableRow) => {
    if (category === 'climate' && isClimateRow(row)) {
      return getClimateBarPercent(row, activeFilter);
    }
    if (category === 'politics' && isPoliticsRow(row)) return row.isBeneficial ? 100 : 20;
    if (category === 'co2' && isCO2Row(row) && activeFilter === 'principais_poluidores') {
      return ((row.polluterEmission || 0) / (row.emissionAmount || 1)) * 100;
    }
    if (category === 'co2' && isCO2Row(row)) return (row.emissionAmount / 300000) * 100;
    return 0;
  };

  const getColor = (row: TableRow) => {
    if (category === 'climate') {
      return isClimateRow(row) ? getClimateBarClass(row, activeFilter) : 'bg-slate-500';
    }
    if (category === 'politics' && isPoliticsRow(row)) return row.isBeneficial ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';

    if (category === 'co2' && isCO2Row(row) && activeFilter === 'principais_poluidores') {
      const polluter = row.topPolluter || '';
      if (polluter === 'Desmatamento') return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
      if (polluter === 'Industria') return 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]';
      if (polluter === 'Transporte') return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]';
      if (polluter === 'Agropecuaria') return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]';
    }
    return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]';
  };

  const getStateName = (row: TableRow) => {
    if (isClimateRow(row) && row.stateName) return row.stateName;
    if ('title' in row && row.title) return row.title;
    return STATE_NAMES[row.stateId] || row.stateId;
  };

  return (
    <div className="flex h-full min-h-[620px] w-full flex-col rounded-[2rem] border border-slate-800 bg-[#111827]/60 p-6 text-slate-300 shadow-2xl backdrop-blur-md">
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="grid grid-cols-12 gap-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 px-6">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Estado / Ref</div>
          <div className="col-span-2">UF</div>
          <div className="col-span-2">{getColName()}</div>
          <div className="col-span-3">Comparacao</div>
        </div>

        <div data-skyflora-scroll-lock="true" className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-2">
          {data.map((row, i) => {
            const stateName = getStateName(row);
            return (
              <div key={`${row.stateId}-${i}`} className="grid grid-cols-12 gap-4 items-center px-6 py-3.5 bg-slate-800/20 hover:bg-slate-800/50 rounded-xl transition-colors border border-transparent hover:border-slate-700/50">
                <div className="col-span-1 text-slate-500 font-serif text-sm">{i + 1}</div>
                <div className="col-span-4 font-bold text-slate-200 text-sm truncate pr-4" title={stateName}>{stateName}</div>
                <div className="col-span-2 text-slate-500 text-xs font-semibold tracking-wider">{row.stateId}</div>
                <div className="col-span-2 font-bold text-white truncate" title={getRowValue(row)}>{getRowValue(row)}</div>
                <div className="col-span-3">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getColor(row)}`} style={{ width: `${Math.min(100, Math.max(0, getPercentage(row)))}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
