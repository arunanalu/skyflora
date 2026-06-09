'use client';
import { useAppStore } from '../../stores/useAppStore';

export function Timeline() {
  const store = useAppStore();
  const { category } = store;
  const monthsLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const yearsList = [2020, 2021, 2022, 2023, 2024];

  if (category === 'hero') return null;

  const noopSetter = () => undefined;
  let month = 12;
  let year = 2024;
  let setMonth: (month: number) => void = noopSetter;
  let setYear: (year: number) => void = noopSetter;

  if (category === 'climate') {
    month = store.climateDate.month;
    year = store.climateDate.year;
    setMonth = (m) => store.setClimateDate({ month: m });
    setYear = (y) => store.setClimateDate({ year: y });
  } else if (category === 'politics') {
    month = store.politicsDate.month;
    year = store.politicsDate.year;
    setMonth = (m) => store.setPoliticsDate({ month: m });
    setYear = (y) => store.setPoliticsDate({ year: y });
  } else if (category === 'co2') {
    year = store.co2Date.year;
    setYear = (y) => store.setCo2Date({ year: y });
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0f172a]/90 backdrop-blur-xl border border-slate-700/60 rounded-full pl-3 pr-2 py-2 flex items-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.7)] z-50 pointer-events-auto">
      
      {category !== 'co2' ? (
        <>
          <div className="flex items-center bg-slate-800/80 rounded-full p-1 text-[11px] font-bold tracking-wide text-slate-400">
            <button className="px-4 py-1.5 rounded-full bg-slate-600 text-white shadow-sm">Meses</button>
            <button className="px-4 py-1.5 rounded-full hover:text-white transition-colors">{year}</button>
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={() => setMonth(month > 1 ? month - 1 : 12)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors text-lg">‹</button>
            {monthsLabels.map((m, index) => {
              const isActive = month === index + 1;
              return (
                <button 
                  key={m}
                  onClick={() => setMonth(index + 1)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${isActive ? 'bg-white text-slate-900 shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                  {m}
                </button>
              );
            })}
            <button onClick={() => setMonth(month < 12 ? month + 1 : 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors text-lg">›</button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center bg-slate-800/80 rounded-full p-1 text-[11px] font-bold tracking-wide text-slate-400">
            <button className="px-4 py-1.5 rounded-full bg-slate-600 text-white shadow-sm">Anos</button>
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={() => setYear(year > 2020 ? year - 1 : 2020)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors text-lg">‹</button>
            {yearsList.map((y) => {
              const isActive = year === y;
              return (
                <button 
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${isActive ? 'bg-white text-slate-900 shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                  {y}
                </button>
              );
            })}
            <button onClick={() => setYear(year < 2024 ? year + 1 : 2024)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors text-lg">›</button>
          </div>
        </>
      )}
    </div>
  );
}
