'use client';
import { useCallback, useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { BrazilMap, StateAnchor } from './BrazilMap';
import { ClimateData } from '../../../domain/entities/ClimateData';
import { CO2Emission } from '../../../domain/entities/CO2Emission';
import { PoliticalProposal } from '../../../domain/entities/PoliticalProposal';
import { getAtmosphereColor, getSoilColor, getTemperatureColor } from '../../lib/climatePresentation';
import {
  computeCO2Maxima,
  getCO2DeforestationColor,
  getCO2SectorColor,
  getCO2TotalEmissionColor,
} from '../../lib/co2Presentation';

type MapDataRow = ClimateData | CO2Emission | PoliticalProposal;
type DataCategory = 'climate' | 'politics' | 'co2';

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

  // Precompute CO2 ranks/maxima once per dataset change
  const co2Maxima = useMemo(() => {
    if (type !== 'co2') return { maxDeforestation: 0, totalEmissionPercentile: new Map<string, number>() };
    const co2Data = data?.filter((r): r is CO2Emission => 'totalEmission' in r) ?? [];
    return computeCO2Maxima(co2Data);
  }, [type, data]);

  const getStateColor = useCallback((id: string): string => {
    const row = rowsByState.get(id);
    if (!row) return '#1e293b';

    if (type === 'climate') {
      const climateRow = row as ClimateData;
      if (activeFilter === 'atmosfera') return getAtmosphereColor(climateRow);
      if (activeFilter === 'solo') return getSoilColor(climateRow);
      return getTemperatureColor(climateRow);
    }

    if (type === 'politics') {
      return (row as PoliticalProposal).isBeneficial ? '#10b981' : '#ef4444';
    }

    const co2Row = row as CO2Emission;

    if (activeFilter === 'setor_dominante') {
      return getCO2SectorColor(co2Row.dominantSector);
    }

    if (activeFilter === 'desmatamento') {
      const deforestEntry = co2Row.top5.find(
        (e) => e.sector === 'Mudança de Uso da Terra e Floresta',
      );
      return getCO2DeforestationColor(
        deforestEntry?.sectorTotalEmission ?? 0,
        co2Maxima.maxDeforestation,
      );
    }

    // Default: emissao_total — percentile rank for even color spread across all states
    const percentile = co2Maxima.totalEmissionPercentile.get(id) ?? 0;
    return getCO2TotalEmissionColor(percentile);
  }, [type, rowsByState, activeFilter, co2Maxima]);

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
