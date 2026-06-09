'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { formatClimateNumber, getClimateSummary } from '../../lib/climatePresentation';

type DetailRow = {
  id?: string;
  stateId?: string;
  title?: string;
  status?: string;
  isBeneficial?: boolean;
  temperature?: number;
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  atmosphereQuality?: number;
  pm10Mean?: number | null;
  pm25Mean?: number | null;
  carbonMonoxideMean?: number | null;
  cloudCoverageMean?: number | null;
  soilMoisture?: number;
  vegetationWaterLossMean?: number | null;
  vegetationWaterStressMean?: number | null;
  vegetationCoverIndexMean?: number | null;
  precipitationTotalMm?: number | null;
  fireSpotsTotal?: number | null;
  emissionAmount?: number;
  topPolluter?: string;
  polluterEmission?: number;
};

export function StateDetailsModal({ data = [], rightOffset = 32 }: { data?: DetailRow[]; rightOffset?: number }) {
  const panelRef = useRef<HTMLElement | null>(null);
  const { selectedStateId, setSelectedStateId, setMunicipalDrilldownUf, category, climateFilter, co2Filter } = useAppStore();

  const close = () => setSelectedStateId(null);
  const stateData = data.filter((d) => d.stateId === selectedStateId);
  const firstRow = stateData[0] || {};

  useEffect(() => {
    if (!selectedStateId) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-skyflora-map="true"]')) return;
      setSelectedStateId(null);
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [selectedStateId, setSelectedStateId]);

  const renderClimateContent = () => {
    if (firstRow.temperature === undefined) {
      return <div className="text-slate-500">Dados nao disponiveis</div>;
    }

    if (climateFilter === 'atmosfera') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Particulas finas" value={formatClimateNumber(firstRow.pm25Mean, ' ug/m3')} tone="sky" />
          <MetricCard label="Particulas inalaveis" value={formatClimateNumber(firstRow.pm10Mean, ' ug/m3')} tone="sky" />
          <MetricCard label="Monoxido de carbono" value={formatClimateNumber(firstRow.carbonMonoxideMean, ' ug/m3')} />
          <MetricCard label="Nuvens medias" value={formatClimateNumber(firstRow.cloudCoverageMean, '%')} />
          <MetricCard label="Precipitacao total" value={formatClimateNumber(firstRow.precipitationTotalMm, ' mm')} tone="sky" wide />
        </div>
      );
    }

    if (climateFilter === 'solo') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Perda de agua" value={formatClimateNumber(firstRow.vegetationWaterLossMean, ' mm/dia')} tone="emerald" />
          <MetricCard label="Estresse hidrico" value={formatClimateNumber(firstRow.vegetationWaterStressMean, ' kPa')} tone="emerald" />
          <MetricCard label="Cobertura vegetal" value={formatClimateNumber(firstRow.vegetationCoverIndexMean)} />
          <MetricCard label="Focos de queimadas" value={formatClimateNumber(firstRow.fireSpotsTotal)} tone="red" />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Temp. maxima" value={formatClimateNumber(firstRow.temperatureMax, ' C')} tone="red" />
        <MetricCard label="Temp. media" value={formatClimateNumber(firstRow.temperature, ' C')} tone="amber" />
        <MetricCard label="Temp. minima" value={formatClimateNumber(firstRow.temperatureMin, ' C')} tone="blue" />
      </div>
    );
  };

  const renderPoliticsContent = () => {
    if (stateData.length === 0) return <div className="text-slate-500">Sem propostas para este estado.</div>;

    return (
      <div className="flex flex-col gap-3 max-h-44 overflow-y-auto pr-2">
        {stateData.map((prop, index) => (
          <div key={prop.id || `prop-${index}`} className="bg-slate-950/35 p-3 rounded-2xl border border-slate-700/50 flex justify-between items-center gap-4">
            <div>
              <div className="text-sm font-bold text-slate-200">{prop.title}</div>
              <div className="text-xs text-slate-500">{prop.status}</div>
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded-md ${prop.isBeneficial ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {prop.isBeneficial ? 'Benefica' : 'Malefica'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCO2Content = () => {
    if (!firstRow.emissionAmount) return <div className="text-slate-500">Dados nao disponiveis</div>;

    if (co2Filter === 'principais_poluidores') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Setor principal" value={firstRow.topPolluter || '-'} tone="indigo" />
          <MetricCard label="Emissao do setor" value={`${firstRow.polluterEmission?.toLocaleString('pt-BR') || 0} Ton`} />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Emissao total" value={`${firstRow.emissionAmount.toLocaleString('pt-BR')} Ton`} tone="purple" />
        <MetricCard label="Impacto relativo" value={`${((firstRow.emissionAmount / 300000) * 100).toFixed(1)}%`} />
      </div>
    );
  };

  const climateSummary = category === 'climate' && firstRow.temperature !== undefined
    ? getClimateSummary(firstRow, climateFilter)
    : null;

  return (
    <AnimatePresence>
      {selectedStateId && (
        <motion.aside
          ref={panelRef}
          key={selectedStateId}
          initial={{ opacity: 0, x: 44, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 44, scale: 0.98 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-28 z-[180] w-[min(38vw,560px)] min-w-[430px] max-h-[calc(100vh-14rem)] pointer-events-auto"
          style={{ right: rightOffset }}
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/70 bg-[#101827]/92 p-7 shadow-2xl shadow-black/45 backdrop-blur-xl">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/90 to-cyan-300/70" />
            <div className="absolute left-0 top-0 h-28 w-28 rounded-br-[3rem] bg-emerald-400/8 blur-2xl" />

            <button
              type="button"
              onClick={close}
              className="absolute top-5 right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/6 text-slate-300 transition-colors hover:bg-white/12 hover:text-white cursor-pointer"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>

            <div className="relative z-10 flex flex-col">
              <div className="mb-6 pr-12">
                <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">Estado em foco</span>
                <div className="flex items-end gap-4">
                  <h2 className="font-serif text-6xl leading-none text-white">{selectedStateId}</h2>
                  <div className="mb-1 h-px flex-1 bg-gradient-to-r from-emerald-400/70 to-transparent" />
                </div>
              </div>

              <div className="mb-5 rounded-3xl border border-slate-700/55 bg-slate-950/28 p-5">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {climateSummary?.title ?? 'Dados consolidados'}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-slate-400">
                  {climateSummary?.description ?? 'Um recorte do estado selecionado para comparar indicadores ambientais, pressoes politicas e sinais de emissao com mais contexto.'}
                </p>
                {category === 'climate' && renderClimateContent()}
                {category === 'politics' && renderPoliticsContent()}
                {category === 'co2' && renderCO2Content()}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setMunicipalDrilldownUf(selectedStateId);
                    setSelectedStateId(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-950/50 transition-colors hover:bg-cyan-500 cursor-pointer"
                >
                  Ver mais detalhes
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function MetricCard({ label, value, tone = 'slate', wide = false }: { label: string; value: string; tone?: 'sky' | 'emerald' | 'red' | 'amber' | 'blue' | 'indigo' | 'purple' | 'slate'; wide?: boolean }) {
  const tones = {
    sky: 'border-sky-900/40 text-sky-300',
    emerald: 'border-emerald-900/40 text-emerald-300',
    red: 'border-red-900/40 text-red-300',
    amber: 'border-amber-900/40 text-amber-300',
    blue: 'border-blue-900/40 text-blue-300',
    indigo: 'border-indigo-900/40 text-indigo-300',
    purple: 'border-purple-900/40 text-purple-300',
    slate: 'border-slate-700/50 text-slate-300',
  };

  return (
    <div className={`rounded-2xl border bg-slate-950/35 p-4 ${tones[tone]}${wide ? ' col-span-2' : ''}`}>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-90">{label}</div>
      <div className="font-serif text-2xl text-white">{value}</div>
    </div>
  );
}
