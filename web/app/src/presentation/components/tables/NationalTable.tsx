'use client';

interface NationalTableProps {
  data: any[];
  category: 'climate' | 'politics' | 'co2';
  activeFilter: string;
}

export function NationalTable({ data, category, activeFilter }: NationalTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-[#111827]/60 backdrop-blur-md rounded-[2rem] border border-slate-800 shadow-2xl p-6 text-center text-slate-500 py-20">
        Nenhum dado encontrado para o período.
      </div>
    );
  }

  const getColName = () => {
    if (category === 'climate') {
      if (activeFilter === 'atmosfera') return 'Qualidade Ar (%)';
      if (activeFilter === 'solo') return 'Umidade Solo (%)';
      return 'Temperatura (°C)';
    }
    if (category === 'politics') return 'Impacto';
    if (category === 'co2' && activeFilter === 'principais_poluidores') return 'Maior Poluidor';
    return 'Emissão (Ton)';
  };

  const getRowValue = (row: any) => {
    if (category === 'climate') {
      if (activeFilter === 'atmosfera') return `${row.atmosphereQuality}%`;
      if (activeFilter === 'solo') return `${row.soilMoisture}%`;
      return `${row.temperature}°C`;
    }
    if (category === 'politics') return row.isBeneficial ? 'Benéfica' : 'Maléfica';
    if (category === 'co2' && activeFilter === 'principais_poluidores') return row.topPolluter || '-';
    return row.emissionAmount;
  };

  const getPercentage = (row: any) => {
    if (category === 'climate') {
      if (activeFilter === 'atmosfera') return row.atmosphereQuality || 0;
      if (activeFilter === 'solo') return row.soilMoisture || 0;
      return (row.temperature / 40) * 100;
    }
    if (category === 'politics') return row.isBeneficial ? 100 : 20;
    if (category === 'co2' && activeFilter === 'principais_poluidores') {
      return ((row.polluterEmission || 0) / (row.emissionAmount || 1)) * 100;
    }
    return (row.emissionAmount / 300000) * 100;
  };

  const getColor = (row: any) => {
    if (category === 'climate') {
      if (activeFilter === 'atmosfera') return 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.6)]';
      if (activeFilter === 'solo') return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]';
      return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]';
    }
    if (category === 'politics') return row.isBeneficial ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
    
    if (category === 'co2' && activeFilter === 'principais_poluidores') {
      const polluter = row.topPolluter || '';
      if (polluter === 'Desmatamento') return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
      if (polluter === 'Indústria') return 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]';
      if (polluter === 'Transporte') return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]';
      if (polluter === 'Agropecuária') return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]';
    }
    return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]';
  };

  return (
    <div className="w-full bg-[#111827]/60 backdrop-blur-md rounded-[2rem] border border-slate-800 shadow-2xl p-6">
      <div className="w-full text-slate-300">
        <div className="grid grid-cols-12 gap-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 px-6">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Estado / Ref</div>
          <div className="col-span-2">UF</div>
          <div className="col-span-2">{getColName()}</div>
          <div className="col-span-3">Comparação</div>
        </div>
        
        <div className="flex flex-col gap-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {data.map((row, i) => {
            const stateName = row.title || (row.stateId === 'SP' ? 'São Paulo' : row.stateId === 'RJ' ? 'Rio de Janeiro' : row.stateId === 'AM' ? 'Amazonas' : row.stateId === 'MT' ? 'Mato Grosso' : row.stateId === 'BA' ? 'Bahia' : row.stateId);
            return (
              <div key={row.id || row.stateId + i} className="grid grid-cols-12 gap-4 items-center px-6 py-3.5 bg-slate-800/20 hover:bg-slate-800/50 rounded-xl transition-colors border border-transparent hover:border-slate-700/50">
                <div className="col-span-1 text-slate-500 font-serif text-sm">{i + 1}</div>
                <div className="col-span-4 font-bold text-slate-200 text-sm truncate pr-4" title={stateName}>{stateName}</div>
                <div className="col-span-2 text-slate-500 text-xs font-semibold tracking-wider">{row.stateId}</div>
                <div className="col-span-2 font-bold text-white">{getRowValue(row)}</div>
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
