'use client';
import { useAppStore } from '../../stores/useAppStore';

export function StateDetailsModal({ data = [] }: { data?: any[] }) {
  const { selectedStateId, setSelectedStateId, category, climateFilter, co2Filter } = useAppStore();

  const close = () => setSelectedStateId(null);

  if (!selectedStateId) return null;

  const stateData = data.filter(d => d.stateId === selectedStateId);
  const firstRow = stateData[0] || {};

  const renderClimateContent = () => {
    if (!firstRow.temperature) return <div className="text-slate-500">Dados não disponíveis</div>;

    if (climateFilter === 'atmosfera') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-sky-900/30">
            <div className="text-[10px] text-sky-400 font-bold uppercase tracking-widest mb-1">Qualidade do Ar</div>
            <div className="text-2xl font-serif text-white">{firstRow.atmosphereQuality}%</div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Risco Respiratório</div>
            <div className="text-2xl font-serif text-white">{firstRow.atmosphereQuality < 50 ? 'Alto' : 'Moderado'}</div>
          </div>
        </div>
      );
    } else if (climateFilter === 'solo') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-emerald-900/30">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Umidade do Solo</div>
            <div className="text-2xl font-serif text-white">{firstRow.soilMoisture}%</div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Risco de Seca</div>
            <div className="text-2xl font-serif text-white">{firstRow.soilMoisture < 40 ? 'Crítico' : 'Normal'}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-red-900/30">
          <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">Temp. Máxima</div>
          <div className="text-2xl font-serif text-white">{firstRow.temperature + 5}C</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-amber-900/30">
          <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1">Temp. Média</div>
          <div className="text-2xl font-serif text-white">{firstRow.temperature}C</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-blue-900/30">
          <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Temp. Mínima</div>
          <div className="text-2xl font-serif text-white">{firstRow.temperature - 4}C</div>
        </div>
      </div>
    );
  };

  const renderPoliticsContent = () => {
    if (stateData.length === 0) return <div className="text-slate-500">Sem propostas para este estado.</div>;
    return (
      <div className="flex flex-col gap-3 max-h-40 overflow-y-auto pr-2">
        {stateData.map(prop => (
          <div key={prop.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex justify-between items-center">
            <div>
              <div className="text-sm font-bold text-slate-200">{prop.title}</div>
              <div className="text-xs text-slate-500">{prop.status}</div>
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded-md ${prop.isBeneficial ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {prop.isBeneficial ? 'Benéfica' : 'Maléfica'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCO2Content = () => {
    if (!firstRow.emissionAmount) return <div className="text-slate-500">Dados não disponíveis</div>;
    if (co2Filter === 'principais_poluidores') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-indigo-900/30">
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Setor Principal</div>
            <div className="text-2xl font-serif text-white">{firstRow.topPolluter || '-'}</div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Emissão do Setor</div>
            <div className="text-2xl font-serif text-white">{(firstRow.polluterEmission || 0).toLocaleString()} Ton</div>
          </div>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-purple-900/30">
          <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">Emissão Total</div>
          <div className="text-2xl font-serif text-white">{firstRow.emissionAmount.toLocaleString()} Ton</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Impacto Relativo</div>
          <div className="text-2xl font-serif text-white">{((firstRow.emissionAmount / 300000) * 100).toFixed(1)}%</div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-[#0b1120]/80 backdrop-blur-md z-[500] flex items-center justify-center p-4"
      onClick={close}
    >
      <div
        className="bg-[#111827] border border-slate-700 rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Top gradient bar — rounded to match card corners */}
        <div className="absolute top-0 left-0 w-full h-1 rounded-tl-[2rem] rounded-tr-[2rem] bg-gradient-to-r from-cyan-400 to-emerald-600" />

        {/* X button positioned well inside the card corners to avoid border-radius clip */}
        <button
          type="button"
          onClick={close}
          className="absolute top-5 right-5 text-slate-300 hover:text-white transition-colors bg-slate-700/80 hover:bg-slate-600 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer select-none"
          aria-label="Fechar"
          style={{ zIndex: 20, fontSize: 18, lineHeight: 1 }}
        >
          ✕
        </button>

        <div className="mb-6 relative z-10">
          <span className="text-xs font-bold tracking-widest uppercase text-cyan-500 mb-2 block">Resumo do Estado</span>
          <h2 className="text-4xl font-serif text-white">{selectedStateId}</h2>
        </div>

        <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50 mb-6 relative z-10">
          <h3 className="text-lg font-semibold text-white mb-2">Dados Consolidados</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Resumo das métricas para {selectedStateId}. Clique em "Ver mais detalhes" para indicadores por municípios, legisladores ou fontes de emissão.
          </p>
          {category === 'climate' && renderClimateContent()}
          {category === 'politics' && renderPoliticsContent()}
          {category === 'co2' && renderCO2Content()}
        </div>

        <div className="flex justify-end relative z-10">
          <button
            onClick={() => alert(`Drill-down municipal para ${selectedStateId} (Em desenvolvimento)`)}
            className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors shadow-lg shadow-cyan-900/50 cursor-pointer"
          >
            Ver mais detalhes
          </button>
        </div>
      </div>
    </div>
  );
}