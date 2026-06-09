'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useAppStore, Category } from '../presentation/stores/useAppStore';
import { InteractiveMap } from '../presentation/components/map/InteractiveMap';
import { StateAnchor } from '../presentation/components/map/BrazilMap';
import { NationalTable } from '../presentation/components/tables/NationalTable';
import { StateDetailsModal } from '../presentation/components/map/StateDetailsModal';
import { Sidebar } from '../presentation/components/sidebar/Sidebar';
import { ClimateData } from '../domain/entities/ClimateData';
import { PoliticalProposal } from '../domain/entities/PoliticalProposal';
import { CO2Emission } from '../domain/entities/CO2Emission';

const SIDEBAR_OFFSET = 308;
const SCROLL_LOCK_MS = 300;
const FOCUS_PANEL_WIDTH = 560;
const FOCUS_CLUSTER_MAX_WIDTH = 1240;
const SECTION_CATS: Category[] = ['hero', 'climate', 'politics', 'co2'];

const SECTION_META = {
  climate:  { tag: '01 • DADOS CLIMÁTICOS',  color: 'text-emerald-400', title: 'O pulso térmico e atmosférico' },
  politics: { tag: '02 • DADOS POLÍTICOS', color: 'text-cyan-400',    title: 'O impacto legislativo no ecossistema' },
  co2:      { tag: '03 • EMISSÕES DE CO₂', color: 'text-purple-400',  title: 'A pegada de carbono anual' },
} as const;

export default function HomePage() {
  const store = useAppStore();
  const { category, setCategory, setSelectedStateId, climateDate, co2Date } = store;

  const [showTable, setShowTable] = useState(false);
  const [stateAnchor, setStateAnchor] = useState<StateAnchor | null>(null);
  const [mapCategory, setMapCategory] = useState<'climate' | 'politics' | 'co2'>('climate');
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError, setClimateError] = useState<string | null>(null);
  const prevCat = useRef<Category>(category);
  useEffect(() => {
    if (prevCat.current !== category) {
      setShowTable(false);
      prevCat.current = category;
    }
  }, [category]);

  const [climateData, setClimateData] = useState<ClimateData[]>([]);
  const [politicsData, setPoliticsData] = useState<PoliticalProposal[]>([]);
  const [co2Data, setCo2Data] = useState<CO2Emission[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        setClimateLoading(true);
        setClimateError(null);
      }
    });

    fetch(`/api/climate?month=${climateDate.month}&year=${climateDate.year}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Erro ao buscar dados climaticos');
        return response.json();
      })
      .then((data) => {
        if (!data.error) setClimateData(data);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setClimateError('Nao foi possivel carregar os dados climaticos.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setClimateLoading(false);
      });

    return () => controller.abort();
  }, [climateDate.month, climateDate.year]);

  useEffect(() => {
    fetch('/api/politics')
      .then((response) => response.json())
      .then((data) => { if (!data.error) setPoliticsData(data); });
  }, []);

  useEffect(() => {
    fetch(`/api/co2?year=${co2Date.year}`)
      .then((response) => response.json())
      .then((data) => { if (!data.error) setCo2Data(data); });
  }, [co2Date.year]);

  const sectionIdx     = useMotionValue(0);
  const currentSection = useRef(0);

  const goToSection = useCallback((idx: number) => {
    const t = Math.max(0, Math.min(3, idx));
    currentSection.current = t;
    if (t === 0) {
      setSelectedStateId(null);
      setStateAnchor(null);
      setShowTable(false);
    } else {
      setMapCategory(SECTION_CATS[t] as 'climate' | 'politics' | 'co2');
    }
    setCategory(SECTION_CATS[t]);
    animate(sectionIdx, t, { type: 'tween', duration: 0.28, ease: 'easeOut' });
  }, [sectionIdx, setCategory, setSelectedStateId]);

  useEffect(() => {
    let locked = false;
    const onWheel = (e: WheelEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-skyflora-scroll-lock="true"]')) {
        return;
      }

      e.preventDefault();
      if (locked) return;
      const next = Math.max(0, Math.min(3, currentSection.current + (e.deltaY > 0 ? 1 : -1)));
      if (next !== currentSection.current) {
        locked = true;
        goToSection(next);
        setTimeout(() => { locked = false; }, SCROLL_LOCK_MS);
      }
    };
    const onNavigate = (e: Event) => goToSection((e as CustomEvent<number>).detail);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('skyflora:navigate', onNavigate);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('skyflora:navigate', onNavigate);
    };
  }, [goToSection]);

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

  const mapData = mapCategory === 'climate' ? climateData
    : mapCategory === 'politics'            ? politicsData
    : co2Data;

  const activeSectionData = category === 'climate' ? climateData
    : category === 'politics'                      ? politicsData
    : co2Data;

  const hasFocusedState = category !== 'hero' && Boolean(store.selectedStateId);
  const contentArea: React.CSSProperties = {
    position: 'fixed', left: SIDEBAR_OFFSET, right: 32, top: 72, bottom: 96,
  };
  const handleStateClick = useCallback((stateId: string, anchor: StateAnchor) => {
    setShowTable(false);
    setStateAnchor(hasFocusedState ? anchor : null);
    setSelectedStateId(stateId);
  }, [hasFocusedState, setSelectedStateId]);

  const handleSelectedStateAnchorChange = useCallback((anchor: StateAnchor) => {
    setStateAnchor(anchor);
  }, []);

  const connectorStart = stateAnchor ?? { x: 690, y: 468 };
  const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const focusClusterLeft = Math.max(SIDEBAR_OFFSET + 32, (viewportWidth - FOCUS_CLUSTER_MAX_WIDTH) / 2);
  const focusClusterRight = viewportWidth - focusClusterLeft - FOCUS_CLUSTER_MAX_WIDTH;
  const focusPanelRight = Math.max(32, focusClusterRight);
  const connectorEnd = {
    x: viewportWidth - focusPanelRight - FOCUS_PANEL_WIDTH + 32,
    y: 300,
  };
  const connectorMid = {
    x: connectorStart.x + (connectorEnd.x - connectorStart.x) * 0.56,
    y: connectorStart.y - 32,
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
            <div className="relative h-14 w-[240px] shrink-0">
              <AnimatePresence initial={false}>
                <motion.div
                  key={category}
                  className="absolute inset-x-0 top-0"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                >
                  <div className={`text-[10px] uppercase tracking-[0.25em] font-bold mb-1 ${meta.color}`}>
                    {meta.tag}
                  </div>
                  <h2 className="text-sm font-serif text-white font-medium leading-snug" style={{ maxWidth: 220 }}>
                    {meta.title}
                  </h2>
                </motion.div>
              </AnimatePresence>
            </div>
            <Sidebar />
          </div>
        )}

        {/* Hero */}
        <motion.section
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale, pointerEvents: category === 'hero' ? 'auto' : 'none' }}
          className="absolute inset-0 flex items-center justify-center p-8"
        >
          <div {...inert(category === 'hero')} className="contents">
            <div className="text-center max-w-5xl z-10">
              <h1 className="text-5xl md:text-7xl font-serif text-white leading-tight font-medium mb-8">
                A ciência do{' '}
                <span className="font-sans italic font-semibold text-emerald-400 drop-shadow-[0_0_24px_rgba(52,211,153,0.28)]">
                  clima
                </span>
                <br />
                e o impacto político num só ecossistema
              </h1>
              <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                Skyflora conecta dados climáticos, decisões legislativas e emissões de CO₂ em visualizações interativas
                para ampliar a visibilidade e a transparência sobre o meio ambiente no Brasil.
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
          style={{
            ...contentArea,
            opacity: hasFocusedState ? 0.58 : mapOpacity,
            zIndex: 10,
            pointerEvents: category === 'hero' ? 'none' : 'auto',
          }}
        >
          <motion.div
            className="h-full w-full"
            animate={{
              x: hasFocusedState ? -128 : 0,
              y: hasFocusedState ? 24 : 0,
              scale: hasFocusedState ? 0.64 : 1,
            }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'center left', willChange: 'transform' }}
          >
            <InteractiveMap
              data={mapData}
              categoryOverride={mapCategory}
              onStateClick={handleStateClick}
              onSelectedStateAnchorChange={handleSelectedStateAnchorChange}
            />
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {hasFocusedState && stateAnchor && (
            <motion.svg
              key="state-focus-connector"
              className="fixed inset-0 pointer-events-none z-[120]"
              width="100vw"
              height="100vh"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="stateFocusGradient"
                  x1={connectorStart.x}
                  y1={connectorStart.y}
                  x2={connectorEnd.x}
                  y2={connectorEnd.y}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#22d3ee" stopOpacity="0.15" />
                  <stop offset="1" stopColor="#34d399" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <motion.path
                d={`M ${connectorStart.x} ${connectorStart.y} C ${connectorMid.x} ${connectorMid.y}, ${connectorEnd.x - 62} ${connectorEnd.y + 8}, ${connectorEnd.x} ${connectorEnd.y}`}
                fill="none"
                stroke="url(#stateFocusGradient)"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                exit={{ pathLength: 0 }}
                transition={{ duration: 0.42, ease: 'easeOut' }}
              />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Table overlay — slides in over the map */}
        <AnimatePresence>
          {category !== 'hero' && !hasFocusedState && showTable && (
            <motion.div
              key="table-overlay"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ ...contentArea, zIndex: 15 }}
            >
              <div data-skyflora-scroll-lock="true" className="h-full w-full overflow-hidden overscroll-contain rounded-2xl border border-slate-800/60 bg-[#111827]/95 p-5 pt-12 backdrop-blur-sm">
                <NationalTable
                  category={category as 'climate' | 'politics' | 'co2'}
                  data={activeSectionData}
                  activeFilter={activeFilter}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button — fixed in content area top-right */}
        {category !== 'hero' && !hasFocusedState && (
          <button
            type="button"
            onClick={() => setShowTable(v => !v)}
            className="fixed z-[20] text-xs font-semibold bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 cursor-pointer transition-all"
            style={{ right: 32, top: 84 }}
          >
            {showTable ? '▧ Mapa' : '≡ Tabela'}
          </button>
        )}

        {category === 'climate' && !hasFocusedState && (climateLoading || climateError) && (
          <div
            className="fixed z-[20] rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md"
            style={{ right: 32, top: 128 }}
          >
            {climateLoading ? 'Carregando clima...' : climateError}
          </div>
        )}

      </div>

      <StateDetailsModal data={activeSectionData} rightOffset={focusPanelRight} />
    </>
  );
}
