'use client';
import { useAppStore } from '../../stores/useAppStore';

export function Sidebar() {
  const store = useAppStore();
  const { category } = store;

  if (category === 'hero') return null;

  const getFilter = () => {
    if (category === 'climate') return store.climateFilter;
    if (category === 'politics') return store.politicsFilter;
    if (category === 'co2') return store.co2Filter;
    return '';
  };

  const setFilter = (filter: string) => {
    if (category === 'climate') store.setClimateFilter(filter);
    else if (category === 'politics') store.setPoliticsFilter(filter);
    else if (category === 'co2') store.setCo2Filter(filter);
  };

  const currentFilter = getFilter();

  return (
    <aside className="w-[260px] bg-[#1e293b]/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-[60] relative pointer-events-auto">
      <h3 className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-6">Filtros Dinâmicos</h3>
      
      <div className="flex flex-col gap-4">
        {category === 'climate' && (
          <>
            <button 
              type="button"
              className={`flex items-center justify-between text-sm hover:text-white transition-colors w-full text-left font-semibold p-3 rounded-lg border ${currentFilter === 'temperatura' || currentFilter === 'temp_max' ? 'bg-white/10 border-white/5 text-slate-200' : 'border-transparent text-slate-400'}`}
              onClick={() => setFilter('temperatura')}
            >
              <span className="flex items-center gap-2">
                <span className="text-slate-400">🌡️</span> Temperatura
              </span>
            </button>

            <button 
              type="button"
              className={`flex items-center justify-between text-sm hover:text-white transition-colors w-full text-left font-semibold p-3 mt-2 rounded-lg border ${currentFilter === 'atmosfera' ? 'bg-white/10 border-white/5 text-slate-200' : 'border-transparent text-slate-400'}`}
              onClick={() => setFilter('atmosfera')}
            >
              <span className="flex items-center gap-2">
                <span>☁️</span> Atmosfera
              </span>
            </button>

            <button 
              type="button"
              className={`flex items-center justify-between text-sm hover:text-white transition-colors w-full text-left font-semibold p-3 mt-2 rounded-lg border ${currentFilter === 'solo' ? 'bg-white/10 border-white/5 text-slate-200' : 'border-transparent text-slate-400'}`}
              onClick={() => setFilter('solo')}
            >
              <span className="flex items-center gap-2">
                <span>🌱</span> Solo
              </span>
            </button>
          </>
        )}

        {category === 'politics' && (
          <>
            <div className="flex flex-col gap-3">
              <button className="flex items-center justify-between text-sm text-slate-200 hover:text-white transition-colors w-full text-left font-semibold">
                <span className="flex items-center gap-2">
                  <span className="text-slate-400">📜</span> Propostas
                </span>
                <span className="text-slate-500 text-xs">▲</span>
              </button>
              
              <div className="flex flex-col gap-1 ml-6 mb-2">
                <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer p-2 rounded-lg transition-colors hover:bg-white/5" onClick={() => setFilter('prop_beneficas')}>
                  <div className={`w-3 h-3 rounded-full ${currentFilter === 'prop_beneficas' ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'border border-slate-600'}`}></div>
                  <span className={currentFilter === 'prop_beneficas' ? 'text-white font-medium' : ''}>Benéficas</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer p-2 rounded-lg transition-colors hover:bg-white/5" onClick={() => setFilter('prop_maleficas')}>
                  <div className={`w-3 h-3 rounded-full ${currentFilter === 'prop_maleficas' ? 'bg-red-400 ring-2 ring-red-400/30' : 'border border-slate-600'}`}></div>
                  <span className={currentFilter === 'prop_maleficas' ? 'text-white font-medium' : ''}>Maléficas</span>
                </label>
              </div>
            </div>

            <div className="h-px w-full bg-slate-800"></div>

            <button type="button" className="flex items-center justify-between text-sm text-slate-400 hover:text-white transition-colors w-full text-left font-semibold" onClick={() => setFilter('prop_aprovadas')}>
              <span className="flex items-center gap-2">
                <span>✅</span> Propostas Aprovadas
              </span>
              <div className={`w-2 h-2 rounded-full ${currentFilter === 'prop_aprovadas' ? 'bg-emerald-400' : 'bg-transparent'}`}></div>
            </button>
          </>
        )}

        {category === 'co2' && (
          <>
            <button
              type="button"
              className={`flex items-center justify-between text-sm hover:text-white transition-colors w-full text-left font-semibold p-3 rounded-lg border ${currentFilter === 'emissao_total' ? 'bg-white/10 border-white/5 text-slate-200' : 'border-transparent text-slate-400'}`}
              onClick={() => setFilter('emissao_total')}
            >
              <span className="flex items-center gap-2">
                <span className="text-slate-400">📊</span> Emissão total
              </span>
            </button>

            <button
              type="button"
              className={`flex items-center justify-between text-sm hover:text-white transition-colors w-full text-left font-semibold p-3 mt-2 rounded-lg border ${currentFilter === 'setor_dominante' ? 'bg-white/10 border-white/5 text-slate-200' : 'border-transparent text-slate-400'}`}
              onClick={() => setFilter('setor_dominante')}
            >
              <span className="flex items-center gap-2">
                <span className="text-slate-400">🏭</span> Setor dominante
              </span>
            </button>

            <button
              type="button"
              className={`flex items-center justify-between text-sm hover:text-white transition-colors w-full text-left font-semibold p-3 mt-2 rounded-lg border ${currentFilter === 'desmatamento' ? 'bg-white/10 border-white/5 text-slate-200' : 'border-transparent text-slate-400'}`}
              onClick={() => setFilter('desmatamento')}
            >
              <span className="flex items-center gap-2">
                <span className="text-slate-400">🌳</span> Desmatamento
              </span>
            </button>

            {currentFilter === 'setor_dominante' && (
              <div className="mt-3 flex flex-col gap-1.5 ml-1">
                {[
                  { color: '#16a34a', label: 'Floresta/Terra' },
                  { color: '#b45309', label: 'Agropecuária' },
                  { color: '#2563eb', label: 'Energia' },
                  { color: '#9333ea', label: 'Ind. processos' },
                  { color: '#6b7280', label: 'Resíduos' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    {label}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
