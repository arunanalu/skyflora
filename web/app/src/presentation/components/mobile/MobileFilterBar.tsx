'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../stores/useAppStore';
import { POLITICS_FILTERS } from '../../lib/politicsPresentation';

type SectionMeta = {
  tag: string;
  color: string;
  title: string;
} | null;

const MOBILE_TOPBAR_H = 52;

export function MobileFilterBar({ meta }: { meta: SectionMeta }) {
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

  const climateFilters = [
    { id: 'temperatura', label: 'Temperatura', emoji: '🌡️' },
    { id: 'atmosfera', label: 'Atmosfera', emoji: '☁️' },
    { id: 'solo', label: 'Solo', emoji: '🌱' },
  ];

  const co2Filters = [
    { id: 'emissao_total', label: 'Emissão', emoji: '📊' },
    { id: 'setor_dominante', label: 'Setor', emoji: '🏭' },
    { id: 'desmatamento', label: 'Desmate', emoji: '🌳' },
  ];

  const filters =
    category === 'climate' ? climateFilters
    : category === 'politics' ? POLITICS_FILTERS.map(f => ({ id: f.id, label: f.label, emoji: f.emoji }))
    : co2Filters;

  return (
    <div
      className="fixed left-0 right-0 z-[190] pointer-events-auto"
      style={{ top: MOBILE_TOPBAR_H }}
    >
      <div className="bg-[#0b1120]/90 backdrop-blur-md border-b border-white/5 px-4 py-2">
        {/* Section tag */}
        <AnimatePresence mode="wait">
          <motion.div
            key={category}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.14 }}
            className="flex items-center gap-3 mb-2"
          >
            {meta && (
              <span className={`text-[9px] uppercase tracking-[0.22em] font-bold ${meta.color}`}>
                {meta.tag}
              </span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {filters.map((f) => {
            const active = currentFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${
                  active
                    ? 'bg-white/12 border-white/15 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-sm leading-none">{f.emoji}</span>
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
