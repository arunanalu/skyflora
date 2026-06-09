'use client';
import { useCallback, useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { BrazilMap, StateAnchor } from './BrazilMap';
import { ClimateData } from '../../../domain/entities/ClimateData';
import { CO2Emission } from '../../../domain/entities/CO2Emission';
import { PoliticalProposal } from '../../../domain/entities/PoliticalProposal';
import { getAtmosphereColor, getSoilColor, getTemperatureColor } from '../../lib/climatePresentation';

type MapDataRow = ClimateData | CO2Emission | PoliticalProposal;
type DataCategory = 'climate' | 'politics' | 'co2';

// Reads category + active filter from store — no props needed for section type
interface InteractiveMapProps {
  data: MapDataRow[];
  categoryOverride?: DataCategory;
  onStateClick: (state: string, anchor: StateAnchor) => void;
  onSelectedStateAnchorChange?: (anchor: StateAnchor) => void;
}

export function InteractiveMap({ data, categoryOverride, onStateClick, onSelectedStateAnchorChange }: InteractiveMapProps) {
  const { selectedStateId, category, climateFilter, politicsFilter, co2Filter } = useAppStore();

  const effectiveCategory = categoryOverride ?? (category === 'hero' ? 'climate' : category);

  const type = effectiveCategory === 'climate' ? 'climate'
    : effectiveCategory === 'politics'         ? 'politics'
    : 'co2';

  const activeFilter = effectiveCategory === 'climate'  ? climateFilter
    : effectiveCategory === 'politics'                   ? politicsFilter
    : co2Filter;

  const rowsByState = useMemo(() => new Map(data?.map(row => [row.stateId, row])), [data]);

  const getStateColor = useCallback((id: string): string => {
    const row = rowsByState.get(id);
    if (!row) return '#1e293b';

    if (type === 'climate') {
      const climateRow = row as ClimateData;
      if (activeFilter === 'atmosfera') {
        return getAtmosphereColor(climateRow);
      }
      if (activeFilter === 'solo') {
        return getSoilColor(climateRow);
      }
      return getTemperatureColor(climateRow);
    }

    if (type === 'politics') {
      return (row as PoliticalProposal).isBeneficial ? '#10b981' : '#ef4444';
    }

    const co2Row = row as CO2Emission;
    if (activeFilter === 'principais_poluidores') {
      switch (co2Row.topPolluter) {
        case 'Desmatamento': return '#ef4444';
        case 'Industria':    return '#6366f1';
        case 'Transporte':   return '#f59e0b';
        case 'Agropecuaria': return '#10b981';
        default:             return '#475569';
      }
    }
    const em = co2Row.emissionAmount ?? 0;
    if (em >= 150000) return '#7c3aed';
    if (em >= 70000)  return '#8b5cf6';
    return '#a78bfa';
  }, [type, rowsByState, activeFilter]);

  return (
    <div className="w-full h-full">
      <BrazilMap
        getStateColor={getStateColor}
        selectedStateId={selectedStateId}
        onStateClick={onStateClick}
        onSelectedStateAnchorChange={onSelectedStateAnchorChange}
      />
    </div>
  );
}
