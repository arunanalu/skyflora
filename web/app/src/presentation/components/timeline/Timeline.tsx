'use client';

import { useEffect, useState } from 'react';
import { AVAILABLE_CLIMATE_DATE, AVAILABLE_CO2_DATE, useAppStore } from '../../stores/useAppStore';

export function Timeline() {
  const store = useAppStore();
  const { category } = store;
  const [notice, setNotice] = useState(false);
  const monthsLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const yearsList = [2020, 2021, 2022, 2023, 2024];

  const showComingSoon = () => {
    setNotice(true);
  };

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => setNotice(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const climateDateChanged = store.climateDate.month !== AVAILABLE_CLIMATE_DATE.month
      || store.climateDate.year !== AVAILABLE_CLIMATE_DATE.year;
    const politicsDateChanged = store.politicsDate.month !== AVAILABLE_CLIMATE_DATE.month
      || store.politicsDate.year !== AVAILABLE_CLIMATE_DATE.year;
    const co2DateChanged = store.co2Date.year !== AVAILABLE_CO2_DATE.year;

    if (!climateDateChanged && !politicsDateChanged && !co2DateChanged) return;

    Promise.resolve().then(() => {
      if (climateDateChanged) store.setClimateDate(AVAILABLE_CLIMATE_DATE);
      if (politicsDateChanged) store.setPoliticsDate(AVAILABLE_CLIMATE_DATE);
      if (co2DateChanged) store.setCo2Date(AVAILABLE_CO2_DATE);
    });
  }, [store]);

  if (category === 'hero') return null;

  let month = 12;
  let year = 2024;

  if (category === 'climate') {
    month = store.climateDate.month;
    year = store.climateDate.year;
  } else if (category === 'politics') {
    month = store.politicsDate.month;
    year = store.politicsDate.year;
  } else if (category === 'co2') {
    year = store.co2Date.year;
  }

  const keepCurrentMonth = (targetMonth: number) => {
    if (targetMonth === 12) return;
    showComingSoon();
  };

  const keepCurrentYear = (targetYear: number) => {
    if (targetYear === 2024) return;
    showComingSoon();
  };

  return (
    <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border border-slate-700/60 bg-[#0f172a]/90 py-2 pl-3 pr-2 shadow-[0_20px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl pointer-events-auto">
      {category !== 'co2' ? (
        <>
          <div className="flex items-center rounded-full bg-slate-800/80 p-1 text-[11px] font-bold tracking-wide text-slate-400">
            <button type="button" onClick={() => keepCurrentMonth(month)} className="rounded-full bg-slate-600 px-4 py-1.5 text-white shadow-sm">Meses</button>
            <button type="button" onClick={() => keepCurrentYear(year)} className="rounded-full px-4 py-1.5 transition-colors hover:text-white">{year}</button>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={showComingSoon} className="flex h-8 w-8 items-center justify-center text-lg text-slate-500 transition-colors hover:text-white">‹</button>
            {monthsLabels.map((label, index) => {
              const targetMonth = index + 1;
              const isActive = month === targetMonth;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => keepCurrentMonth(targetMonth)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${isActive ? 'scale-105 bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  {label}
                </button>
              );
            })}
            <button type="button" onClick={showComingSoon} className="flex h-8 w-8 items-center justify-center text-lg text-slate-500 transition-colors hover:text-white">›</button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center rounded-full bg-slate-800/80 p-1 text-[11px] font-bold tracking-wide text-slate-400">
            <button type="button" onClick={() => keepCurrentYear(year)} className="rounded-full bg-slate-600 px-4 py-1.5 text-white shadow-sm">Anos</button>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={showComingSoon} className="flex h-8 w-8 items-center justify-center text-lg text-slate-500 transition-colors hover:text-white">‹</button>
            {yearsList.map((targetYear) => {
              const isActive = year === targetYear;

              return (
                <button
                  key={targetYear}
                  type="button"
                  onClick={() => keepCurrentYear(targetYear)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 ${isActive ? 'scale-105 bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  {targetYear}
                </button>
              );
            })}
            <button type="button" onClick={showComingSoon} className="flex h-8 w-8 items-center justify-center text-lg text-slate-500 transition-colors hover:text-white">›</button>
          </div>
        </>
      )}

      {notice && (
        <div className="absolute left-1/2 top-[-3.25rem] -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-slate-950/90 px-4 py-2 text-xs font-semibold text-slate-200 shadow-xl shadow-black/40">
          Mais datas em breve
        </div>
      )}
    </div>
  );
}
