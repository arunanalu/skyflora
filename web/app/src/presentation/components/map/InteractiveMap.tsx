'use client';
import { useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { BrazilMap } from './BrazilMap';

// Reads category + active filter from store — no props needed for section type
interface InteractiveMapProps {
  data: any[];
  onStateClick: (state: string) => void;
}

export function InteractiveMap({ data, onStateClick }: InteractiveMapProps) {
  const { selectedStateId, category, climateFilter, politicsFilter, co2Filter } = useAppStore();

  const type = category === 'climate' ? 'climate'
    : category === 'politics'         ? 'politics'
    : 'co2';

  const activeFilter = category === 'climate'  ? climateFilter
    : category === 'politics'                   ? politicsFilter
    : co2Filter;

  const getStateColor = useCallback((id: string): string => {
    const row = data?.find((d: any) => d.stateId === id);
    if (!row) return '#1e293b';

    if (type === 'climate') {
      if (activeFilter === 'atmosfera') {
        const v = row.atmosphereQuality ?? 0;
        if (v >= 80) return '#38bdf8';
        if (v >= 50) return '#0ea5e9';
        return '#0284c7';
      }
      if (activeFilter === 'solo') {
        const v = row.soilMoisture ?? 0;
        if (v >= 70) return '#34d399';
        if (v >= 40) return '#10b981';
        return '#059669';
      }
      const v = row.temperature ?? 0;
      if (v >= 30) return '#ea580c';
      if (v >= 28) return '#d97706';
      return '#f59e0b';
    }

    if (type === 'politics') {
      return row.isBeneficial ? '#10b981' : '#ef4444';
    }

    if (activeFilter === 'principais_poluidores') {
      switch (row.topPolluter) {
        case 'Desmatamento': return '#ef4444';
        case 'Industria':    return '#6366f1';
        case 'Transporte':   return '#f59e0b';
        case 'Agropecuaria': return '#10b981';
        default:             return '#475569';
      }
    }
    const em = row.emissionAmount ?? 0;
    if (em >= 150000) return '#7c3aed';
    if (em >= 70000)  return '#8b5cf6';
    return '#a78bfa';
  }, [type, data, activeFilter]);

  return (
    <div className="w-full h-full">
      <BrazilMap
        getStateColor={getStateColor}
        selectedStateId={selectedStateId}
        onStateClick={onStateClick}
      />
    </div>
  );
}
