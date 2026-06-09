'use client';

import { useEffect, useState } from 'react';
import { AVAILABLE_CLIMATE_DATE, AVAILABLE_CO2_DATE, useAppStore } from '../../stores/useAppStore';
import { useIsMobile } from '../../hooks/useIsMobile';

export function Timeline() {
  const store = useAppStore();
  const { category } = store;
  const isMobile = useIsMobile();
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

  if (isMobile) {
    const activeLabel = category === 'co2' ? String(year) : `${monthsLabels[month - 1]} ${year}`;

    return (
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-[#0f172a]/92 p-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <button
            type="button"
            onClick={showComingSoon}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Periodo anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={showComingSoon}
            className="min-w-28 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-900 shadow-md"
          >
            {activeLabel}
          </button>
          <button
            type="button"
            onClick={showComingSoon}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Proximo periodo"
          >
            ›
          </button>
        </div>

        {notice && (
          <div className="absolute left-1/2 top-[-3.25rem] -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-slate-950/90 px-4 py-2 text-xs font-semibold text-slate-200 shadow-xl shadow-black/40">
            Mais datas em breve
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 md:bottom-8 left-1/2 z-50 -translate-x-1/2 pointer-events-auto
                    max-w-[calc(100vw-2rem)] md:max-w-none">
      <div className="flex items-center gap-2 md:gap-4 rounded-full border border-slate-700/60 bg-[#0f172a]/90 py-1.5 md:py-2 pl-2 md:pl-3 pr-1.5 md:pr-2 shadow-[0_20px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        {category !== 'co2' ? (
          <>
            <div className="flex items-center rounded-full bg-slate-800/80 p-1 text-[10px] md:text-[11px] font-bold tracking-wide text-slate-400 shrink-0">
              <button type="button" onClick={() => keepCurrentMonth(month)} className="rounded-full bg-slate-600 px-2.5 md:px-4 py-1 md:py-1.5 text-white shadow-sm">Meses</button>
              <button type="button" onClick={() => keepCurrentYear(year)} className="rounded-full px-2.5 md:px-4 py-1 md:py-1.5 transition-colors hover:text-white">{year}</button>
            </div>

            <div className="flex items-center gap-0.5 md:gap-1 overflow-x-auto scrollbar-none">
              <button type="button" onClick={showComingSoon} className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center text-base md:text-lg text-slate-500 transition-colors hover:text-white shrink-0">‹</button>
              {monthsLabels.map((label, index) => {
                const targetMonth = index + 1;
                const isActive = month === targetMonth;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => keepCurrentMonth(targetMonth)}
                    className={`rounded-full px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-semibold transition-all duration-300 shrink-0 ${isActive ? 'scale-105 bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  >
                    {label}
                  </button>
                );
              })}
              <button type="button" onClick={showComingSoon} className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center text-base md:text-lg text-slate-500 transition-colors hover:text-white shrink-0">›</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center rounded-full bg-slate-800/80 p-1 text-[10px] md:text-[11px] font-bold tracking-wide text-slate-400 shrink-0">
              <button type="button" onClick={() => keepCurrentYear(year)} className="rounded-full bg-slate-600 px-2.5 md:px-4 py-1 md:py-1.5 text-white shadow-sm">Anos</button>
            </div>

            <div className="flex items-center gap-0.5 md:gap-1">
              <button type="button" onClick={showComingSoon} className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center text-base md:text-lg text-slate-500 transition-colors hover:text-white">‹</button>
              {yearsList.map((targetYear) => {
                const isActive = year === targetYear;

                return (
                  <button
                    key={targetYear}
                    type="button"
                    onClick={() => keepCurrentYear(targetYear)}
                    className={`rounded-full px-2.5 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-semibold transition-all duration-300 ${isActive ? 'scale-105 bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  >
                    {targetYear}
                  </button>
                );
              })}
              <button type="button" onClick={showComingSoon} className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center text-base md:text-lg text-slate-500 transition-colors hover:text-white">›</button>
            </div>
          </>
        )}
      </div>

      {notice && (
        <div className="absolute left-1/2 top-[-3.25rem] -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-slate-950/90 px-4 py-2 text-xs font-semibold text-slate-200 shadow-xl shadow-black/40">
          Mais datas em breve
        </div>
      )}
    </div>
  );
}
