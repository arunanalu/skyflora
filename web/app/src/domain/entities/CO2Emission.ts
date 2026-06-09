export type CO2Sector =
  | 'Mudança de Uso da Terra e Floresta'
  | 'Agropecuária'
  | 'Energia'
  | 'Processos Industriais'
  | 'Resíduos';

export interface CO2CategoryEntry {
  sector: CO2Sector;
  sectorTotalEmission: number;
  sectorShareOfState: number;
  category: string;
  categoryEmission: number;
  categoryShareOfSector: number;
  recordCount: number;
}

export interface CO2Emission {
  stateId: string;
  stateName: string;
  year: number;
  totalEmission: number;
  dominantSector: CO2Sector;
  top5: CO2CategoryEntry[];
  processedAt: string;
}
