'use client';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useAppStore, Category } from '../presentation/stores/useAppStore';
import { InteractiveMap } from '../presentation/components/map/InteractiveMap';
import { NationalTable } from '../presentation/components/tables/NationalTable';
import { StateDetailsModal } from '../presentation/components/map/StateDetailsModal';
import { Sidebar } from '../presentation/components/sidebar/Sidebar';
import { ClimateData } from '../domain/entities/ClimateData';

const SIDEBAR_OFFSET = 308;
const SECTION_CATS: Category[] = ['hero', 'climate', 'politics', 'co2'];

const SECTION_META = {
  climate:  { tag: '01 • DADOS CLIMÁTICOS',  color: 'text-emerald-400', title: 'O pulso térmico e atmosférico' },
  politics: { tag: '02 • DADOS POLÍTICOS', color: 'text-cyan-400',    title: 'O impacto legislativo no ecossistema' },
  co2:      { tag: '03 • EMISSÕES DE CO₂', color: 'text-purple-400',  title: 'A pegada de carbono anual' },
} as const;

export default function HomePage() {
  const store = useAppStore();
  const { category, setCategory, setSelectedStateId } = store;

  const [showTable, setShowTable] = useState(false);
  const prevCat = useRef<Category>(category);
  useEffect(() => {
    if (prevCat.current !== category) {
      setShowTable(false);
      prevCat.current = category;
    }
  }, [category]);

  const [climateData, setClimateData] = useState<ClimateData[]>([]);
  useEffect(() => {
    fetch('/api/climate?month=12&year=2024')
      .then(r => r.json())
      .then(d => { if (!d.error) setClimateData(d); });
  }, []);

  const sectionIdx     = useMotionValue(0);
  const currentSection = useRef(0);

  const goToSection = (idx: number) => {
    const t = Math.max(0, Math.min(3, idx));
    currentSection.current = t;
    setCategory(SECTION_CATS[t]);
    animate(sectionIdx, t, { type: 'spring', stiffness: 400, damping: 60, mass: 1 });
  };

  useEffect(() => {
    let locked = false;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (locked) return;
      const next = Math.max(0, Math.min(3, currentSection.current + (e.deltaY > 0 ? 1 : -1)));
      if (next !== currentSection.current) {
        locked = true;
        goToSection(next);
        setTimeout(() => { locked = false; }, 560);
      }
    };
    const onNavigate = (e: Event) => goToSection((e as CustomEvent<number>).detail);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('skyflora:navigate', onNavigate);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('skyflora:navigate', onNavigate);
    };
  }, []);

  const heroOpacity = useTransform(sectionIdx, [0, 1], [1, 0]);
  const heroY       = useTransform(sectionIdx, [0, 1], [0, -80]);
  const heroScale   = useTransform(sectionIdx, [0, 1], [1, 0.96]);
  const mapOpacity  = useTransform(sectionIdx, [0, 1], [0, 1]);
  const bgOpacity   = useTransform(sectionIdx, [0, 1], [1, 0]);

  const inert = (active: boolean) => active ? {} : { inert: true };

  const meta = category !== 'hero'
    ? SECTION_META[category as keyof typeof SECTION_META]
    : null;

  const activeFilter = category === 'climate'  ? store.climateFilter
    : category === 'politics'                   ? store.politicsFilter
    : store.co2Filter;

  const contentArea: React.CSSProperties = {
    position: 'fixed', left: SIDEBAR_OFFSET, right: 32, top: 72, bottom: 96,
  };

  return (
    <>
      <div className="fixed inset-0 w-full h-screen overflow-hidden">

        <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0 pointer-events-none z-0">
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 1200 800" preserveAspectRatio="none">
            {Array.from({ length: 12 }).map((_, i) => (
              <path key={i} d={`M-100 ${100 + i * 60} Q 300 ${50 + i * 60} 600 ${120 + i * 60} T 1300 ${100 + i * 60}`}
                fill="none" stroke="currentColor" strokeWidth="1" />
            ))}
          </svg>
        </motion.div>

        {/* Left panel: animated title + persistent sidebar */}
        {category !== 'hero' && meta && (
          <div
            className="fixed left-8 z-[200] pointer-events-auto flex flex-col justify-center gap-5"
            style={{ top: 72, bottom: 96 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className={`text-[10px] uppercase tracking-[0.25em] font-bold mb-1 ${meta.color}`}>
                  {meta.tag}
                </div>
                <h2 className="text-sm font-serif text-white font-medium leading-snug" style={{ maxWidth: 220 }}>
                  {meta.title}
                </h2>
              </motion.div>
            </AnimatePresence>
            <Sidebar />
          </div>
        )}

        {/* Hero */}
        <motion.section
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale, pointerEvents: category === 'hero' ? 'auto' : 'none' }}
          className="absolute inset-0 flex items-center justify-center p-8"
        >
          <div {...inert(category === 'hero')} className="contents">
            <div className="text-center max-w-4xl z-10">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs uppercase tracking-widest text-slate-300">Observatório Nacional</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif text-white leading-tight font-medium mb-8">
                A ciência do clima e o impacto político num só ecossistema
              </h1>
              <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Skyflora funde dados climáticos, legislativos e emissões de CO₂ em uma única visualização interativa.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('skyflora:navigate', { detail: 1 }))}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 w-14 h-14 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-110 cursor-pointer"
            >
              <svg className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </motion.section>

        {/* Persistent map — stays mounted, colors update with category */}
        <motion.div
          style={{ ...contentArea, opacity: mapOpacity, zIndex: 10, pointerEvents: category === 'hero' ? 'none' : 'auto' }}
        >
          <InteractiveMap data={climateData} onStateClick={setSelectedStateId} />
        </motion.div>

        {/* Table overlay — slides in over the map */}
        <AnimatePresence>
          {category !== 'hero' && showTable && (
            <motion.div
              key="table-overlay"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ ...contentArea, zIndex: 15 }}
            >
              <div className="w-full h-full overflow-auto rounded-2xl bg-[#111827]/95 border border-slate-800/60 p-5 pt-12 backdrop-blur-sm">
                <NationalTable
                  category={category as 'climate' | 'politics' | 'co2'}
                  data={climateData}
                  activeFilter={activeFilter}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button — fixed in content area top-right */}
        {category !== 'hero' && (
          <button
            type="button"
            onClick={() => setShowTable(v => !v)}
            className="fixed z-[20] text-xs font-semibold bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 cursor-pointer transition-all"
            style={{ right: 32, top: 84 }}
          >
            {showTable ? '▧ Mapa' : '≡ Tabela'}
          </button>
        )}

      </div>

      <StateDetailsModal data={climateData} />
    </>
  );
}
