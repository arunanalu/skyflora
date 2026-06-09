'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { MunicipalDrilldownContent } from './MunicipalDrilldownContent';
import { useIsMobile } from '../../hooks/useIsMobile';

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
};

const FILTER_TABS = [
  { key: 'temperatura', label: 'Temperatura' },
  { key: 'atmosfera',   label: 'Atmosfera'   },
  { key: 'solo',        label: 'Solo'         },
] as const;

type ClimateFilter = typeof FILTER_TABS[number]['key'];

export function MunicipalDrilldownOverlay() {
  const isMobile = useIsMobile();
  const { municipalDrilldownUf, setMunicipalDrilldownUf, climateFilter } = useAppStore();

  // Start with whichever filter was active on the map; user can switch within the overlay
  const [activeFilter, setActiveFilter] = useState<ClimateFilter>('temperatura');

  // Sync filter when overlay opens
  useEffect(() => {
    if (municipalDrilldownUf) {
      const valid = FILTER_TABS.map((t) => t.key);
      Promise.resolve().then(() => {
        setActiveFilter(valid.includes(climateFilter as ClimateFilter) ? (climateFilter as ClimateFilter) : 'temperatura');
      });
    }
  }, [municipalDrilldownUf, climateFilter]);

  const close = () => setMunicipalDrilldownUf(null);

  useEffect(() => {
    if (!municipalDrilldownUf) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipalDrilldownUf]);

  return (
    <AnimatePresence>
      {municipalDrilldownUf && (
        <motion.div
          key="municipal-overlay"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[300] flex flex-col bg-[#0a1120]/96 backdrop-blur-md"
          style={{ paddingTop: isMobile ? 52 : 60 }}
        >
          {/* Header */}
          <div className={`border-b border-slate-800 flex-shrink-0 ${isMobile ? 'flex flex-col gap-3 px-4 py-3' : 'flex flex-wrap items-center gap-4 px-8 py-4'}`}>
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">
                  Dados Municipais · Clima · Dezembro 2024
                </div>
                <div className="flex items-baseline gap-2 md:gap-3 mt-0.5">
                  <span className={`font-serif leading-none text-white ${isMobile ? 'text-2xl' : 'text-4xl'}`}>{municipalDrilldownUf}</span>
                  <span className={`font-semibold text-slate-400 truncate ${isMobile ? 'text-sm' : 'text-lg'}`}>
                    {STATE_NAMES[municipalDrilldownUf] ?? municipalDrilldownUf}
                  </span>
                </div>
              </div>
              {isMobile && (
                <button
                  type="button"
                  onClick={close}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/6 text-slate-300 transition-colors hover:bg-white/12 hover:text-white cursor-pointer flex-shrink-0"
                  aria-label="Fechar painel municipal"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className={`flex items-center gap-0.5 md:gap-1 rounded-xl border border-slate-700/50 bg-slate-800/40 p-1 ${isMobile ? 'w-full' : ''}`}>
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`rounded-lg px-2.5 md:px-4 py-1 md:py-1.5 text-xs font-semibold transition-colors cursor-pointer ${isMobile ? 'flex-1' : ''} ${
                    activeFilter === tab.key
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {!isMobile && (
              <button
                type="button"
                onClick={close}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-slate-300 transition-colors hover:bg-white/12 hover:text-white cursor-pointer flex-shrink-0"
                aria-label="Fechar painel municipal"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>

          <MunicipalDrilldownContent uf={municipalDrilldownUf} filter={activeFilter} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
