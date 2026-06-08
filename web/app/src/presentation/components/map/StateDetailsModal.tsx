'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

type DetailRow = {
  id?: string;
  stateId?: string;
  title?: string;
  status?: string;
  isBeneficial?: boolean;
  temperature?: number;
  atmosphereQuality?: number;
  soilMoisture?: number;
  emissionAmount?: number;
  topPolluter?: string;
  polluterEmission?: number;
};

export function StateDetailsModal({ data = [] }: { data?: DetailRow[] }) {
  const { selectedStateId, setSelectedStateId, category, climateFilter, co2Filter } = useAppStore();

  const close = () => setSelectedStateId(null);
  const stateData = data.filter(d => d.stateId === selectedStateId);
  const firstRow = stateData[0] || {};

  const renderClimateContent = () => {
    if (!firstRow.temperature) return <div className="text-slate-500">Dados não disponíveis</div>;

    if (climateFilter === 'atmosfera') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Qualidade do Ar" value={`${firstRow.atmosphereQuality}%`} tone="sky" />
          <MetricCard label="Risco Respiratório" value={(firstRow.atmosphereQuality ?? 0) < 50 ? 'Alto' : 'Moderado'} />
        </div>
      );
    }

    if (climateFilter === 'solo') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Umidade do Solo" value={`${firstRow.soilMoisture}%`} tone="emerald" />
          <MetricCard label="Risco de Seca" value={(firstRow.soilMoisture ?? 0) < 40 ? 'Crítico' : 'Normal'} />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Temp. Máxima" value={`${firstRow.temperature + 5}C`} tone="red" />
        <MetricCard label="Temp. Média" value={`${firstRow.temperature}C`} tone="amber" />
        <MetricCard label="Temp. Mínima" value={`${firstRow.temperature - 4}C`} tone="blue" />
      </div>
    );
  };

  const renderPoliticsContent = () => {
    if (stateData.length === 0) return <div className="text-slate-500">Sem propostas para este estado.</div>;

    return (
      <div className="flex flex-col gap-3 max-h-44 overflow-y-auto pr-2">
        {stateData.map(prop => (
          <div key={prop.id} className="bg-slate-950/35 p-3 rounded-2xl border border-slate-700/50 flex justify-between items-center gap-4">
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
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Setor Principal" value={firstRow.topPolluter || '-'} tone="indigo" />
          <MetricCard label="Emissão do Setor" value={`${(firstRow.polluterEmission || 0).toLocaleString()} Ton`} />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Emissão Total" value={`${firstRow.emissionAmount.toLocaleString()} Ton`} tone="purple" />
        <MetricCard label="Impacto Relativo" value={`${((firstRow.emissionAmount / 300000) * 100).toFixed(1)}%`} />
      </div>
    );
  };

  return (
    <AnimatePresence>
      {selectedStateId && (
        <motion.aside
          key={selectedStateId}
          initial={{ opacity: 0, x: 44, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 44, scale: 0.98 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="fixed right-8 top-28 z-[180] w-[min(38vw,560px)] min-w-[430px] max-h-[calc(100vh-14rem)] pointer-events-auto"
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
                <h3 className="mb-2 text-lg font-semibold text-white">Dados consolidados</h3>
                <p className="mb-4 text-sm leading-relaxed text-slate-400">
                  Um recorte do estado selecionado para comparar indicadores ambientais, pressões políticas e sinais de emissão com mais contexto.
                </p>
                {category === 'climate' && renderClimateContent()}
                {category === 'politics' && renderPoliticsContent()}
                {category === 'co2' && renderCO2Content()}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => alert(`Drill-down municipal para ${selectedStateId} (Em desenvolvimento)`)}
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

function MetricCard({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'sky' | 'emerald' | 'red' | 'amber' | 'blue' | 'indigo' | 'purple' | 'slate' }) {
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
    <div className={`rounded-2xl border bg-slate-950/35 p-4 ${tones[tone]}`}>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-90">{label}</div>
      <div className="font-serif text-2xl text-white">{value}</div>
    </div>
  );
}
