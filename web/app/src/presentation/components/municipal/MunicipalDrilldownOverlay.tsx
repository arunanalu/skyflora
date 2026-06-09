'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { MunicipalDrilldownContent } from './MunicipalDrilldownContent';

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
};

export function MunicipalDrilldownOverlay() {
  const { municipalDrilldownUf, setMunicipalDrilldownUf } = useAppStore();

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
          style={{ paddingTop: 60 }} // respects Topbar height
        >
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-slate-800 px-8 py-5 flex-shrink-0">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">
                  Dados Municipais · Clima · Dezembro 2024
                </div>
                <div className="flex items-baseline gap-3 mt-0.5">
                  <span className="font-serif text-4xl leading-none text-white">{municipalDrilldownUf}</span>
                  <span className="text-lg font-semibold text-slate-400">
                    {STATE_NAMES[municipalDrilldownUf] ?? municipalDrilldownUf}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={close}
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-slate-300 transition-colors hover:bg-white/12 hover:text-white cursor-pointer"
              aria-label="Fechar painel municipal"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Content */}
          <MunicipalDrilldownContent uf={municipalDrilldownUf} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
