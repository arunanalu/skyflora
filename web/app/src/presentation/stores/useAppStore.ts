import { create } from 'zustand';

export type Category = 'hero' | 'climate' | 'politics' | 'co2';

export const AVAILABLE_CLIMATE_DATE = { month: 12, year: 2024 } as const;
export const AVAILABLE_CO2_DATE = { year: 2024 } as const;
export const AVAILABLE_POLITICS_PERIODO = '2024-12' as const;

export interface AppState {
  category: Category;
  selectedStateId: string | null;
  municipalDrilldownUf: string | null;

  climateDate: { month: number; year: number };
  politicsDate: { month: number; year: number };
  co2Date: { year: number };

  climateFilter: string;
  politicsFilter: string;
  co2Filter: string;

  setCategory: (category: Category) => void;
  setSelectedStateId: (stateId: string | null) => void;
  setMunicipalDrilldownUf: (uf: string | null) => void;

  setClimateDate: (date: Partial<{ month: number; year: number }>) => void;
  setPoliticsDate: (date: Partial<{ month: number; year: number }>) => void;
  setCo2Date: (date: { year: number }) => void;

  setClimateFilter: (filter: string) => void;
  setPoliticsFilter: (filter: string) => void;
  setCo2Filter: (filter: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  category: 'hero',
  selectedStateId: null,
  municipalDrilldownUf: null,

  climateDate: { month: 12, year: 2024 },
  politicsDate: { month: 12, year: 2024 },
  co2Date: { year: 2024 },

  climateFilter: 'temperatura',
  politicsFilter: 'atividade',
  co2Filter: 'emissao_total',

  setCategory: (category) => set({ category }),
  setSelectedStateId: (selectedStateId) => set({ selectedStateId }),
  setMunicipalDrilldownUf: (municipalDrilldownUf) => set({ municipalDrilldownUf }),

  setClimateDate: () => set({ climateDate: AVAILABLE_CLIMATE_DATE }),
  setPoliticsDate: () => set({ politicsDate: AVAILABLE_CLIMATE_DATE }),
  setCo2Date: () => set({ co2Date: AVAILABLE_CO2_DATE }),

  setClimateFilter: (filter) => set({ climateFilter: filter }),
  setPoliticsFilter: (filter) => set({ politicsFilter: filter }),
  setCo2Filter: (filter) => set({ co2Filter: filter }),
}));
